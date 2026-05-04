import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  getDayEvents,
  isCalendarConnected,
  type DayEvent,
} from "@/lib/google";
import SignOutButton from "./sign-out-button";
import InquiryRow, { type InquiryRowData } from "./inquiry-row";
import { disconnectCalendar } from "./actions";

const calendarBannerCopy = (status: string | undefined, message: string | undefined) => {
  switch (status) {
    case "connected":
      return { tone: "success" as const, text: "Google Calendar connected." };
    case "error":
      return {
        tone: "error" as const,
        text: `Google denied the connection${message ? `: ${message}` : "."}`,
      };
    case "missing_code":
      return {
        tone: "error" as const,
        text: "Google didn't return an authorization code. Try again.",
      };
    case "no_refresh_token":
      return {
        tone: "error" as const,
        text:
          "Google didn't return a refresh token. Disconnect on your Google account's app permissions page, then try again.",
      };
    case "exchange_failed":
      return {
        tone: "error" as const,
        text: `Couldn't exchange the authorization code${message ? `: ${message}` : "."}`,
      };
    default:
      return null;
  }
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ calendar?: string; message?: string }>;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const banner = calendarBannerCopy(params.calendar, params.message);
  const calendarConnected = await isCalendarConnected();

  const { data, error } = await supabase
    .from("inquiries")
    .select(
      "id, created_at, client_name, client_email, project_type, event_date, budget_range, message, status, draft_reply, draft_status, draft_generated_at, sent_at, calendar_event_id, calendar_event_link, stripe_invoice_id, stripe_hosted_url, invoice_amount_cents, invoice_status",
    )
    .order("created_at", { ascending: false });

  const inquiries: InquiryRowData[] = data ?? [];

  const eventsByDate = new Map<string, DayEvent[] | null>();
  if (calendarConnected) {
    const uniqueDates = Array.from(
      new Set(
        inquiries
          .map((i) => i.event_date)
          .filter((d): d is string => !!d),
      ),
    );
    const results = await Promise.all(
      uniqueDates.map(
        async (date) => [date, await getDayEvents(date)] as const,
      ),
    );
    for (const [date, events] of results) {
      eventsByDate.set(date, events);
    }
  }

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
          {calendarConnected ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
              <span className="font-medium text-emerald-800">Calendar connected</span>
              <form action={disconnectCalendar}>
                <button
                  type="submit"
                  className="text-xs font-medium text-emerald-700 underline-offset-2 hover:underline"
                >
                  Disconnect
                </button>
              </form>
            </div>
          ) : (
            <a
              href="/api/google/connect"
              className="inline-flex h-10 items-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Connect Calendar
            </a>
          )}
          <a
            href="/prospects"
            className="inline-flex h-10 items-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Prospects
          </a>
          <a
            href="/submit"
            className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            New Inquiry
          </a>
          <SignOutButton />
        </div>
      </div>

      {banner && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            banner.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {banner.text}
        </div>
      )}

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
                  <InquiryRow
                    key={inquiry.id}
                    inquiry={inquiry}
                    events={
                      inquiry.event_date
                        ? eventsByDate.get(inquiry.event_date) ?? null
                        : null
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
