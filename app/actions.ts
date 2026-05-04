"use server";

import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createShootEvent, deleteRefreshToken } from "@/lib/google";
import { KENNY_REPLY_SYSTEM_PROMPT } from "@/lib/prompts";

type InquiryForPrompt = {
  client_name: string;
  client_email: string;
  project_type: string | null;
  event_date: string | null;
  budget_range: string | null;
  message: string | null;
};

const formatInquiryForPrompt = (inquiry: InquiryForPrompt) =>
  [
    `Client name: ${inquiry.client_name}`,
    `Client email: ${inquiry.client_email}`,
    `Project type: ${inquiry.project_type ?? "not specified"}`,
    `Event date: ${inquiry.event_date ?? "not specified"}`,
    `Budget range: ${inquiry.budget_range ?? "not specified"}`,
    "",
    "Their message:",
    inquiry.message?.trim() || "(no message)",
    "",
    "Draft a first-reply email body for Kenny to send to this client.",
  ].join("\n");

const requireUser = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");
  return supabase;
};

export async function generateDraft(inquiryId: string) {
  const supabase = await requireUser();

  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .select(
      "client_name, client_email, project_type, event_date, budget_range, message",
    )
    .eq("id", inquiryId)
    .single<InquiryForPrompt>();

  if (error || !inquiry) {
    throw new Error("Inquiry not found");
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: KENNY_REPLY_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: formatInquiryForPrompt(inquiry) }],
  });

  const draftText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!draftText) {
    throw new Error("Claude returned an empty draft");
  }

  const { error: updateError } = await supabase
    .from("inquiries")
    .update({
      draft_reply: draftText,
      draft_status: "ready_to_send",
      draft_generated_at: new Date().toISOString(),
    })
    .eq("id", inquiryId);

  if (updateError) {
    throw new Error(`Failed to save draft: ${updateError.message}`);
  }

  revalidatePath("/");
}

export async function saveDraft(inquiryId: string, draftReply: string) {
  const supabase = await requireUser();

  const trimmed = draftReply.trim();
  if (!trimmed) {
    throw new Error("Draft is empty");
  }

  const { error } = await supabase
    .from("inquiries")
    .update({
      draft_reply: trimmed,
      draft_status: "ready_to_send",
    })
    .eq("id", inquiryId);

  if (error) {
    throw new Error(`Failed to save draft: ${error.message}`);
  }

  revalidatePath("/");
}

type InquiryForSend = {
  client_name: string;
  client_email: string;
  project_type: string | null;
};

const buildSubject = (projectType: string | null) =>
  projectType
    ? `Re: your ${projectType.toLowerCase()} inquiry`
    : "Re: your inquiry";

export async function sendDraft(inquiryId: string, draftReply: string) {
  const supabase = await requireUser();

  const trimmed = draftReply.trim();
  if (!trimmed) {
    throw new Error("Draft is empty");
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const { data: inquiry, error: lookupError } = await supabase
    .from("inquiries")
    .select("client_name, client_email, project_type")
    .eq("id", inquiryId)
    .single<InquiryForSend>();

  if (lookupError || !inquiry) {
    throw new Error("Inquiry not found");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: sendError } = await resend.emails.send({
    from: "Kenny <onboarding@resend.dev>",
    to: inquiry.client_email,
    subject: buildSubject(inquiry.project_type),
    text: trimmed,
  });

  if (sendError) {
    throw new Error(`Failed to send: ${sendError.message}`);
  }

  const sentAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("inquiries")
    .update({
      draft_reply: trimmed,
      draft_status: "sent",
      sent_at: sentAt,
    })
    .eq("id", inquiryId);

  if (updateError) {
    throw new Error(`Email sent, but failed to record: ${updateError.message}`);
  }

  revalidatePath("/");
}

type InquiryForBooking = {
  client_name: string;
  project_type: string | null;
  event_date: string | null;
  budget_range: string | null;
  message: string | null;
  calendar_event_id: string | null;
};

export async function bookShoot(inquiryId: string) {
  const supabase = await requireUser();

  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .select(
      "client_name, project_type, event_date, budget_range, message, calendar_event_id",
    )
    .eq("id", inquiryId)
    .single<InquiryForBooking>();

  if (error || !inquiry) {
    throw new Error("Inquiry not found");
  }

  if (!inquiry.event_date) {
    throw new Error("This inquiry has no event date");
  }

  if (inquiry.calendar_event_id) {
    throw new Error("This inquiry is already booked");
  }

  const title = `${inquiry.client_name} — ${inquiry.project_type ?? "shoot"}`;
  const description = [
    inquiry.message?.trim() || "(no message)",
    "",
    `Budget: ${inquiry.budget_range ?? "not specified"}`,
  ].join("\n");

  const created = await createShootEvent({
    dateString: inquiry.event_date,
    title,
    description,
  });

  if (!created) {
    throw new Error("Calendar isn't connected");
  }

  const { error: updateError } = await supabase
    .from("inquiries")
    .update({
      status: "booked",
      calendar_event_id: created.id,
      calendar_event_link: created.htmlLink,
    })
    .eq("id", inquiryId);

  if (updateError) {
    throw new Error(
      `Calendar event created, but failed to record: ${updateError.message}`,
    );
  }

  revalidatePath("/");
}

export async function disconnectCalendar() {
  await requireUser();
  await deleteRefreshToken();
  revalidatePath("/");
}

export async function trashDraft(inquiryId: string) {
  const supabase = await requireUser();

  const { error } = await supabase
    .from("inquiries")
    .update({
      draft_reply: null,
      draft_status: "trashed",
      draft_generated_at: null,
    })
    .eq("id", inquiryId);

  if (error) {
    throw new Error(`Failed to trash draft: ${error.message}`);
  }

  revalidatePath("/");
}
