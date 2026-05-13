"use server";

import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { KENNY_PROSPECT_SYSTEM_PROMPT } from "@/lib/prompts";
import { FROM_ADDRESS } from "@/lib/email";

const requireUser = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");
  return supabase;
};

export async function addProspect(formData: FormData) {
  const supabase = await requireUser();

  const brandName = String(formData.get("brand_name") ?? "").trim();
  const contactName =
    String(formData.get("contact_name") ?? "").trim() || null;
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const fitNotes = String(formData.get("fit_notes") ?? "").trim() || null;

  if (!brandName) throw new Error("Brand name is required");
  if (!contactEmail) throw new Error("Contact email is required");

  const { error } = await supabase.from("prospects").insert({
    brand_name: brandName,
    contact_name: contactName,
    contact_email: contactEmail,
    fit_notes: fitNotes,
  });

  if (error) throw new Error(`Failed to add prospect: ${error.message}`);
  revalidatePath("/prospects");
}

type ProspectForPrompt = {
  brand_name: string;
  contact_name: string | null;
  fit_notes: string | null;
};

const formatProspectForPrompt = (p: ProspectForPrompt) =>
  [
    `Brand: ${p.brand_name}`,
    `Contact name: ${p.contact_name ?? "not provided"}`,
    "",
    "Fit notes (use this to make the email specific — these are the only details about the brand you should rely on):",
    p.fit_notes?.trim() || "(none provided)",
    "",
    "Draft a cold outreach email body for Kenny to send.",
  ].join("\n");

export async function generateProspectDraft(prospectId: string) {
  const supabase = await requireUser();

  const { data: prospect, error } = await supabase
    .from("prospects")
    .select("brand_name, contact_name, fit_notes")
    .eq("id", prospectId)
    .single<ProspectForPrompt>();

  if (error || !prospect) throw new Error("Prospect not found");

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: KENNY_PROSPECT_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: formatProspectForPrompt(prospect) }],
  });

  const draftText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!draftText) throw new Error("Claude returned an empty draft");

  const { error: updateError } = await supabase
    .from("prospects")
    .update({
      draft_reply: draftText,
      draft_status: "ready_to_send",
      draft_generated_at: new Date().toISOString(),
    })
    .eq("id", prospectId);

  if (updateError)
    throw new Error(`Failed to save draft: ${updateError.message}`);

  revalidatePath("/prospects");
}

export async function saveProspectDraft(prospectId: string, draft: string) {
  const supabase = await requireUser();
  const trimmed = draft.trim();
  if (!trimmed) throw new Error("Draft is empty");

  const { error } = await supabase
    .from("prospects")
    .update({ draft_reply: trimmed, draft_status: "ready_to_send" })
    .eq("id", prospectId);

  if (error) throw new Error(`Failed to save draft: ${error.message}`);
  revalidatePath("/prospects");
}

export async function sendProspectDraft(prospectId: string, draft: string) {
  const supabase = await requireUser();

  const trimmed = draft.trim();
  if (!trimmed) throw new Error("Draft is empty");
  if (!process.env.RESEND_API_KEY)
    throw new Error("RESEND_API_KEY is not configured");

  const { data: prospect, error } = await supabase
    .from("prospects")
    .select("brand_name, contact_email")
    .eq("id", prospectId)
    .single<{ brand_name: string; contact_email: string }>();

  if (error || !prospect) throw new Error("Prospect not found");

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: sendError } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: prospect.contact_email,
    subject: `Quick idea for ${prospect.brand_name}`,
    text: trimmed,
  });

  if (sendError) throw new Error(`Failed to send: ${sendError.message}`);

  const { error: updateError } = await supabase
    .from("prospects")
    .update({
      draft_reply: trimmed,
      draft_status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", prospectId);

  if (updateError)
    throw new Error(
      `Email sent, but failed to record: ${updateError.message}`,
    );

  revalidatePath("/prospects");
}

const ALLOWED_STATUSES = ["replied", "declined", "retainer_signed"] as const;
export type ProspectStatus = (typeof ALLOWED_STATUSES)[number];

export async function markProspectStatus(
  prospectId: string,
  status: ProspectStatus | null,
) {
  const supabase = await requireUser();
  if (status !== null && !ALLOWED_STATUSES.includes(status)) {
    throw new Error("Invalid status");
  }

  const { error } = await supabase
    .from("prospects")
    .update({ status })
    .eq("id", prospectId);

  if (error) throw new Error(`Failed to update status: ${error.message}`);
  revalidatePath("/prospects");
}

export async function deleteProspect(prospectId: string) {
  const supabase = await requireUser();
  const { error } = await supabase
    .from("prospects")
    .delete()
    .eq("id", prospectId);
  if (error) throw new Error(`Failed to delete: ${error.message}`);
  revalidatePath("/prospects");
}
