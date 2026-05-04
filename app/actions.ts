"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
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
