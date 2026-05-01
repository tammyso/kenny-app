import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import SignOutButton from "./sign-out-button";

type Inquiry = {
  id: string;
  created_at: string;
  client_name: string;
  client_email: string;
  project_type: string | null;
  event_date: string | null;
  budget_range: string | null;
  message: string | null;
  status: string | null;
};

const displayDate = (value: string | null) => {
  if (!value) return "-";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;

  return parsedDate.toLocaleDateString();
};

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
      "id, created_at, client_name, client_email, project_type, event_date, budget_range, message, status",
    )
    .order("created_at", { ascending: false });

  const inquiries: Inquiry[] = data ?? [];

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
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {inquiries.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-zinc-500" colSpan={8}>
                    {error ? "Unable to load inquiries right now." : "No inquiries yet."}
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="align-top">
                    <td className="px-4 py-3 text-zinc-700">
                      {displayDate(inquiry.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {inquiry.client_name}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{inquiry.client_email}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {inquiry.project_type || "-"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {displayDate(inquiry.event_date)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {inquiry.budget_range || "-"}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-zinc-700">
                      {inquiry.message || "-"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{inquiry.status || "new"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
