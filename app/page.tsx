import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import SignOutButton from "./sign-out-button";
import InquiryRow, { type InquiryRowData } from "./inquiry-row";

export default async function Home() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("inquiries")
    .select(
      "id, created_at, client_name, client_email, project_type, event_date, budget_range, message, status, draft_reply, draft_status, draft_generated_at",
    )
    .order("created_at", { ascending: false });

  const inquiries: InquiryRowData[] = data ?? [];

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">Inquiry Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {error
              ? "There was a problem loading inquiries."
              : `Showing ${inquiries.length} submissions.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/submit"
            className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            New Inquiry
          </a>
          <SignOutButton />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-700">Date Submitted</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Name</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Email</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Project Type</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Event Date</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Budget</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Message</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Status</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Draft</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {inquiries.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-zinc-500" colSpan={9}>
                    {error ? "Unable to load inquiries right now." : "No inquiries yet."}
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <InquiryRow key={inquiry.id} inquiry={inquiry} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
