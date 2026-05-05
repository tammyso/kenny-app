import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isCalendarConnected } from "@/lib/google";
import AppShell from "../app-shell";
import NewProspectForm from "./new-prospect-form";
import ProspectCard, { type ProspectData } from "./prospect-card";

export default async function ProspectsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const calendarConnected = await isCalendarConnected();

  const { data, error } = await supabase
    .from("prospects")
    .select(
      "id, created_at, brand_name, contact_name, contact_email, fit_notes, draft_reply, draft_status, draft_generated_at, sent_at, status",
    )
    .order("created_at", { ascending: false });

  const prospects: ProspectData[] = data ?? [];

  return (
    <AppShell calendarConnected={calendarConnected}>
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-zinc-900">Brand prospects</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {error
              ? "There was a problem loading prospects."
              : `Tracking ${prospects.length} ${prospects.length === 1 ? "brand" : "brands"}.`}
          </p>
        </div>

        <NewProspectForm />

        <div className="mt-8 space-y-4">
          {prospects.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
              No prospects yet. Add a brand above — the more specific the fit
              notes, the better the AI&apos;s cold-outreach draft.
            </p>
          ) : (
            prospects.map((p) => <ProspectCard key={p.id} prospect={p} />)
          )}
        </div>
      </div>
    </AppShell>
  );
}
