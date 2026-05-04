import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import SignOutButton from "../sign-out-button";
import NewProspectForm from "./new-prospect-form";
import ProspectCard, { type ProspectData } from "./prospect-card";

export default async function ProspectsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("prospects")
    .select(
      "id, created_at, brand_name, contact_name, contact_email, fit_notes, draft_reply, draft_status, draft_generated_at, sent_at, status",
    )
    .order("created_at", { ascending: false });

  const prospects: ProspectData[] = data ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">Prospects</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {error
              ? "There was a problem loading prospects."
              : `Tracking ${prospects.length} ${prospects.length === 1 ? "brand" : "brands"}.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Inquiries
          </Link>
          <SignOutButton />
        </div>
      </div>

      <NewProspectForm />

      <div className="mt-8 space-y-4">
        {prospects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
            No prospects yet. Add one above.
          </p>
        ) : (
          prospects.map((p) => <ProspectCard key={p.id} prospect={p} />)
        )}
      </div>
    </main>
  );
}
