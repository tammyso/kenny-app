"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export type QuestionnaireResponses = {
  location: string;
  schedule: string;
  must_have_shots: string;
  music_vibe: string;
  day_of_contacts: string;
  notes: string;
};

// Public action — no auth required, called from the questionnaire page that
// the client opens via emailed link. Uses the admin client to bypass the
// authenticated-only RLS on inquiries.
export async function saveQuestionnaire(
  inquiryId: string,
  responses: QuestionnaireResponses,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(responses)) {
    cleaned[key] = String(value ?? "").trim();
  }

  const supabase = createSupabaseAdminClient();

  // Only allow saving against booked inquiries — guards against spray attacks
  // on random UUIDs and against overwriting an inquiry that's been archived.
  const { data: existing, error: fetchErr } = await supabase
    .from("inquiries")
    .select("id, status")
    .eq("id", inquiryId)
    .maybeSingle<{ id: string; status: string | null }>();

  if (fetchErr || !existing || existing.status !== "booked") {
    return { ok: false, error: "Couldn't find that booking" };
  }

  const { error: updateErr } = await supabase
    .from("inquiries")
    .update({
      pre_shoot_responses: cleaned,
      pre_shoot_completed_at: new Date().toISOString(),
    })
    .eq("id", inquiryId);

  if (updateErr) {
    return { ok: false, error: "Couldn't save — please try again" };
  }

  revalidatePath(`/project/${inquiryId}`);
  revalidatePath("/");
  return { ok: true };
}
