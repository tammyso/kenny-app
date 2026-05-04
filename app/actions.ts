"use server";

import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  createShootEvent,
  deleteRefreshToken,
  getDayEvents,
  type DayEvent,
} from "@/lib/google";
import { fetchInvoiceStatus, sendInvoiceForShoot } from "@/lib/stripe";
import { KENNY_REPLY_SYSTEM_PROMPT } from "@/lib/prompts";
import { researchClient } from "@/lib/research";
import { getSiteUrl } from "@/lib/site-url";
import { triageInquiry, type TriageResult } from "@/lib/triage";

type InquiryForPrompt = {
  client_name: string;
  client_email: string;
  project_type: string | null;
  event_date: string | null;
  budget_range: string | null;
  message: string | null;
};

type CalendarContext =
  | { state: "free" }
  | { state: "busy"; events: DayEvent[] };

const formatCalendarLine = (calendar: CalendarContext | null): string | null => {
  if (!calendar) return null;
  if (calendar.state === "free") {
    return "Calendar: the requested date appears free on Kenny's calendar.";
  }
  return [
    "Calendar: the requested date conflicts with these existing events on Kenny's calendar:",
    ...calendar.events.map((e) => `- ${e.title} (${e.timeLabel})`),
  ].join("\n");
};

const formatInquiryForPrompt = (
  inquiry: InquiryForPrompt,
  calendar: CalendarContext | null,
) => {
  const sections: string[] = [
    [
      `Client name: ${inquiry.client_name}`,
      `Client email: ${inquiry.client_email}`,
      `Project type: ${inquiry.project_type ?? "not specified"}`,
      `Event date: ${inquiry.event_date ?? "not specified"}`,
      `Budget range: ${inquiry.budget_range ?? "not specified"}`,
    ].join("\n"),
    `Their message:\n${inquiry.message?.trim() || "(no message)"}`,
  ];
  const calendarLine = formatCalendarLine(calendar);
  if (calendarLine) sections.push(calendarLine);
  sections.push("Draft a first-reply email body for Kenny to send to this client.");
  return sections.join("\n\n");
};

const requireUser = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");
  return supabase;
};

type SubmitInquiryResult = { ok: true } | { ok: false; error: string };

export async function submitInquiry(
  formData: FormData,
): Promise<SubmitInquiryResult> {
  const supabase = await createSupabaseServerClient();

  const clientName = String(formData.get("client_name") ?? "").trim();
  const clientEmail = String(formData.get("client_email") ?? "").trim();
  const projectType =
    String(formData.get("project_type") ?? "").trim() || null;
  const eventDate = String(formData.get("event_date") ?? "").trim() || null;
  const budgetRange =
    String(formData.get("budget_range") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim() || null;

  if (!clientName) return { ok: false, error: "Name is required" };
  if (!clientEmail) return { ok: false, error: "Email is required" };

  const { data: inserted, error } = await supabase
    .from("inquiries")
    .insert({
      client_name: clientName,
      client_email: clientEmail,
      project_type: projectType,
      event_date: eventDate,
      budget_range: budgetRange,
      message,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: "Couldn't submit. Please try again." };
  }

  const inquiryId = inserted.id as string;
  const inquirySummary = {
    clientName,
    clientEmail,
    projectType,
    eventDate,
    budgetRange,
    message,
  };

  // Auto-draft the AI reply, triage for spam/low-value, and research the
  // client's brand — all in parallel after the response goes out so the
  // form-submitting client doesn't wait. Each step fails soft.
  after(async () => {
    const admin = createSupabaseAdminClient();

    const [draftSettled, triageSettled, researchSettled] =
      await Promise.allSettled([
        runDraftGeneration({ inquiryId, supabase: admin }),
        triageInquiry({
          clientName,
          clientEmail,
          projectType,
          budgetRange,
          message,
        }),
        researchClient({ clientName, clientEmail }),
      ]);

    const draft = draftSettled.status === "fulfilled" ? draftSettled.value : null;
    if (draftSettled.status === "rejected") {
      console.error("Auto-draft failed:", draftSettled.reason);
    }

    const triage =
      triageSettled.status === "fulfilled" ? triageSettled.value : null;
    if (triageSettled.status === "rejected") {
      console.error("Triage failed:", triageSettled.reason);
    }

    const research =
      researchSettled.status === "fulfilled" ? researchSettled.value : null;
    if (researchSettled.status === "rejected") {
      console.error("Research failed:", researchSettled.reason);
    }

    // Persist triage and research to the inquiry. Draft is already saved by
    // runDraftGeneration. Done in one update so the row only revalidates once.
    if (triage || research) {
      const update: Record<string, string | null> = {};
      if (triage) {
        update.triage_tag = triage.tag;
        update.triage_reason = triage.reason || null;
      }
      if (research) {
        update.client_research = research;
      }
      const { error: updateErr } = await admin
        .from("inquiries")
        .update(update)
        .eq("id", inquiryId);
      if (updateErr) {
        console.error("Saving triage/research failed:", updateErr);
      }
    }

    try {
      await sendNewInquiryNotification(
        inquiryId,
        inquirySummary,
        draft,
        triage,
        research,
      );
    } catch (notifyErr) {
      console.error("Inquiry notification failed:", notifyErr);
    }
  });

  revalidatePath("/");
  return { ok: true };
}

type InquirySummary = {
  clientName: string;
  clientEmail: string;
  projectType: string | null;
  eventDate: string | null;
  budgetRange: string | null;
  message: string | null;
};

const triageSubjectPrefix = (tag: TriageResult["tag"] | undefined): string => {
  switch (tag) {
    case "flagged":
      return "[FLAGGED] ";
    case "low_value":
      return "[Low priority] ";
    default:
      return "";
  }
};

async function sendNewInquiryNotification(
  inquiryId: string,
  summary: InquirySummary,
  draft: string | null,
  triage: TriageResult | null,
  research: string | null,
) {
  if (!process.env.OWNER_NOTIFICATION_EMAIL || !process.env.RESEND_API_KEY) {
    return;
  }

  const lines = [
    `New inquiry from ${summary.clientName} <${summary.clientEmail}>`,
    "",
    `Project type: ${summary.projectType ?? "not specified"}`,
    `Event date: ${summary.eventDate ?? "not specified"}`,
    `Budget range: ${summary.budgetRange ?? "not specified"}`,
    "",
    "Their message:",
    summary.message ?? "(no message)",
  ];

  if (triage && triage.tag !== "clean") {
    const label = triage.tag === "flagged" ? "Flagged" : "Low priority";
    lines.push(
      "",
      "— — —",
      `Priority: ${label}${triage.reason ? ` — ${triage.reason}` : ""}`,
    );
  }

  if (research) {
    lines.push("", "— — —", "Client research:", "", research);
  }

  if (draft) {
    lines.push(
      "",
      "— — —",
      "AI draft reply (review and send from your dashboard):",
      "",
      draft,
    );
  }
  lines.push("", `Open the dashboard: ${getSiteUrl()}/?inquiry=${inquiryId}`);

  const subjectPrefix = triageSubjectPrefix(triage?.tag);
  const draftSuffix = draft ? " — draft ready" : "";

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Kenny App <onboarding@resend.dev>",
    to: process.env.OWNER_NOTIFICATION_EMAIL,
    subject: `${subjectPrefix}New inquiry from ${summary.clientName}${draftSuffix}`,
    text: lines.join("\n"),
  });
}

export async function archiveInquiry(inquiryId: string) {
  const supabase = await requireUser();
  const { error } = await supabase
    .from("inquiries")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", inquiryId);
  if (error) throw new Error(`Failed to archive: ${error.message}`);
  revalidatePath("/");
}

export async function unarchiveInquiry(inquiryId: string) {
  const supabase = await requireUser();
  const { error } = await supabase
    .from("inquiries")
    .update({ archived_at: null })
    .eq("id", inquiryId);
  if (error) throw new Error(`Failed to unarchive: ${error.message}`);
  revalidatePath("/");
}

export async function updateInternalNotes(inquiryId: string, notes: string) {
  const supabase = await requireUser();
  const { error } = await supabase
    .from("inquiries")
    .update({ internal_notes: notes.trim() || null })
    .eq("id", inquiryId);
  if (error) throw new Error(`Failed to save notes: ${error.message}`);
  revalidatePath("/");
}

// Core draft-generation routine, factored out so both the authenticated
// "Draft reply" button and the unauthenticated /submit auto-draft flow can
// reuse it. Caller supplies the supabase client so this works with either
// the cookies-auth server client or the service-role admin client.
async function runDraftGeneration(args: {
  inquiryId: string;
  supabase: SupabaseClient;
}): Promise<string> {
  const { data: inquiry, error } = await args.supabase
    .from("inquiries")
    .select(
      "client_name, client_email, project_type, event_date, budget_range, message",
    )
    .eq("id", args.inquiryId)
    .single<InquiryForPrompt>();

  if (error || !inquiry) {
    throw new Error("Inquiry not found");
  }

  let calendar: CalendarContext | null = null;
  if (inquiry.event_date) {
    const events = await getDayEvents(inquiry.event_date, args.supabase);
    if (events) {
      calendar =
        events.length === 0 ? { state: "free" } : { state: "busy", events };
    }
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
    messages: [
      { role: "user", content: formatInquiryForPrompt(inquiry, calendar) },
    ],
  });

  const draftText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!draftText) {
    throw new Error("Claude returned an empty draft");
  }

  const { error: updateError } = await args.supabase
    .from("inquiries")
    .update({
      draft_reply: draftText,
      draft_status: "ready_to_send",
      draft_generated_at: new Date().toISOString(),
    })
    .eq("id", args.inquiryId);

  if (updateError) {
    throw new Error(`Failed to save draft: ${updateError.message}`);
  }

  return draftText;
}

export async function generateDraft(inquiryId: string) {
  const supabase = await requireUser();
  await runDraftGeneration({ inquiryId, supabase });
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
  client_email: string;
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
      "client_name, client_email, project_type, event_date, budget_range, message, calendar_event_id",
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

  // Send the client a booking confirmation with their project room URL.
  // Failure here is logged, not thrown — the booking itself succeeded.
  if (process.env.RESEND_API_KEY) {
    try {
      const projectUrl = `${getSiteUrl()}/project/${inquiryId}`;
      const projectLabel = inquiry.project_type ?? "shoot";
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Kenny <onboarding@resend.dev>",
        to: inquiry.client_email,
        subject: `Booking confirmed — your ${projectLabel.toLowerCase()} with Kenny`,
        text: [
          `Hi ${inquiry.client_name.split(" ")[0] ?? inquiry.client_name},`,
          "",
          `Your ${projectLabel.toLowerCase()} on ${inquiry.event_date} is on the books — looking forward to it.`,
          "",
          "I've set up a project page for you. It's the live status for everything from here on out — booking details, invoice, and (later) deliverables. Bookmark it and check back any time:",
          "",
          projectUrl,
          "",
          "Talk soon,",
          "— Kenny",
        ].join("\n"),
      });
    } catch (notifyErr) {
      console.error("Booking confirmation failed:", notifyErr);
    }
  }

  revalidatePath("/");
}

type InquiryForInvoice = {
  client_name: string;
  client_email: string;
  status: string | null;
  stripe_invoice_id: string | null;
};

export async function sendInvoice(args: {
  inquiryId: string;
  amountCents: number;
  description: string;
}) {
  const supabase = await requireUser();

  const description = args.description.trim();
  if (!description) throw new Error("Invoice description is required");
  if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
    throw new Error("Invoice amount must be a positive whole number of cents");
  }

  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .select("client_name, client_email, status, stripe_invoice_id")
    .eq("id", args.inquiryId)
    .single<InquiryForInvoice>();

  if (error || !inquiry) throw new Error("Inquiry not found");
  if (inquiry.status !== "booked") {
    throw new Error("Only booked inquiries can be invoiced");
  }
  if (inquiry.stripe_invoice_id) {
    throw new Error("This inquiry already has an invoice");
  }

  const result = await sendInvoiceForShoot({
    customerName: inquiry.client_name,
    customerEmail: inquiry.client_email,
    amountCents: args.amountCents,
    description,
  });

  const { error: updateError } = await supabase
    .from("inquiries")
    .update({
      stripe_invoice_id: result.id,
      stripe_hosted_url: result.hostedUrl,
      invoice_amount_cents: args.amountCents,
      invoice_status: result.status,
    })
    .eq("id", args.inquiryId);

  if (updateError) {
    throw new Error(
      `Invoice sent, but failed to record: ${updateError.message}`,
    );
  }

  revalidatePath("/");
}

export async function refreshInvoiceStatus(inquiryId: string) {
  const supabase = await requireUser();

  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .select("stripe_invoice_id")
    .eq("id", inquiryId)
    .single<{ stripe_invoice_id: string | null }>();

  if (error || !inquiry) throw new Error("Inquiry not found");
  if (!inquiry.stripe_invoice_id) {
    throw new Error("This inquiry has no invoice");
  }

  const status = await fetchInvoiceStatus(inquiry.stripe_invoice_id);

  const { error: updateError } = await supabase
    .from("inquiries")
    .update({ invoice_status: status })
    .eq("id", inquiryId);

  if (updateError) {
    throw new Error(`Failed to update status: ${updateError.message}`);
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
