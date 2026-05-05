import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  getDayEvents,
  isCalendarConnected,
  type DayEvent,
} from "@/lib/google";
import AppShell from "./app-shell";
import InquiryRow, { type InquiryRowData } from "./inquiry-row";
import DashboardBoard from "./dashboard-board";
import DashboardStatsPanel from "./dashboard-stats";
import DashboardToolbar from "./dashboard-toolbar";
import { computeDashboardStats } from "@/lib/stats";

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
  searchParams: Promise<{
    calendar?: string;
    message?: string;
    archived?: string;
    view?: string;
    q?: string;
    filter?: string;
    snoozed?: string;
  }>;
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
  const showingArchived = params.archived === "1";
  const showingSnoozed = params.snoozed === "1";
  const isBoardView = params.view === "board";
  const searchQ = (params.q ?? "").trim();
  const activeFilter = params.filter ?? null;

  let query = supabase
    .from("inquiries")
    .select(
      "id, created_at, client_name, client_email, project_type, event_date, budget_range, message, status, draft_reply, draft_status, draft_generated_at, sent_at, calendar_event_id, calendar_event_link, stripe_invoice_id, stripe_hosted_url, invoice_amount_cents, invoice_status, archived_at, internal_notes, triage_tag, triage_reason, client_research, client_references, booked_at, invoice_sent_at, delivered_at, review_requested_at, pre_shoot_responses, pre_shoot_completed_at, deliverable_url, snoozed_until",
    )
    .order("created_at", { ascending: false });

  query = showingArchived
    ? query.not("archived_at", "is", null)
    : query.is("archived_at", null);

  // Snoozed inquiries are hidden from default active view until their date
  // arrives, but a "Snoozed" view (?snoozed=1) shows them explicitly.
  const nowIso = new Date().toISOString();
  if (!showingArchived) {
    query = showingSnoozed
      ? query.gt("snoozed_until", nowIso)
      : query.or(`snoozed_until.is.null,snoozed_until.lte.${nowIso}`);
  }

  if (searchQ) {
    query = query.or(
      `client_name.ilike.%${searchQ}%,client_email.ilike.%${searchQ}%,project_type.ilike.%${searchQ}%`,
    );
  }

  if (activeFilter === "flagged") {
    query = query.eq("triage_tag", "flagged");
  } else if (activeFilter === "paid") {
    query = query.eq("invoice_status", "paid");
  } else if (activeFilter === "unpaid") {
    query = query.eq("invoice_status", "open");
  }

  const { data, error } = await query;

  const inquiries: InquiryRowData[] = data ?? [];

  // Stats reflect every inquiry (including archived) — archiving hides from
  // the main view, doesn't mean "didn't earn money."
  const { data: allInquiriesForStats } = await supabase
    .from("inquiries")
    .select(
      "id, created_at, project_type, invoice_amount_cents, invoice_status, invoice_sent_at",
    );
  const stats = computeDashboardStats(
    (allInquiriesForStats ?? []) as InquiryRowData[],
  );

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
    <AppShell calendarConnected={calendarConnected}>
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">Inquiries</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {error
              ? "There was a problem loading inquiries."
              : showingArchived
                ? `Showing ${inquiries.length} archived ${inquiries.length === 1 ? "inquiry" : "inquiries"}.`
                : showingSnoozed
                  ? `Showing ${inquiries.length} snoozed ${inquiries.length === 1 ? "inquiry" : "inquiries"}.`
                  : `Showing ${inquiries.length} active ${inquiries.length === 1 ? "inquiry" : "inquiries"}.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex h-10 items-center rounded-lg border border-zinc-300 bg-white p-0.5 text-sm font-medium">
            <a
              href={showingArchived ? "/?archived=1" : "/"}
              className={`inline-flex h-full items-center rounded-md px-3 transition ${
                !isBoardView
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              List
            </a>
            <a
              href={
                showingArchived ? "/?archived=1&view=board" : "/?view=board"
              }
              className={`inline-flex h-full items-center rounded-md px-3 transition ${
                isBoardView
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              Board
            </a>
          </div>
          <div className="inline-flex h-10 items-center rounded-lg border border-zinc-300 bg-white p-0.5 text-sm font-medium">
            {[
              { label: "Active", href: isBoardView ? "/?view=board" : "/", isActive: !showingArchived && !showingSnoozed },
              { label: "Snoozed", href: isBoardView ? "/?snoozed=1&view=board" : "/?snoozed=1", isActive: showingSnoozed },
              { label: "Archived", href: isBoardView ? "/?archived=1&view=board" : "/?archived=1", isActive: showingArchived },
            ].map((view) => (
              <a
                key={view.label}
                href={view.href}
                className={`inline-flex h-full items-center rounded-md px-3 transition ${
                  view.isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {view.label}
              </a>
            ))}
          </div>
          <a
            href="/submit"
            className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            New Inquiry
          </a>
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

      {!showingArchived && !showingSnoozed && (
        <DashboardStatsPanel stats={stats} />
      )}

      {!isBoardView && <DashboardToolbar />}

      {isBoardView ? (
        <DashboardBoard inquiries={inquiries} />
      ) : (
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="hidden px-4 py-3 font-semibold text-zinc-700 lg:table-cell">Date Submitted</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Name</th>
                <th className="hidden px-4 py-3 font-semibold text-zinc-700 lg:table-cell">Email</th>
                <th className="hidden px-4 py-3 font-semibold text-zinc-700 sm:table-cell">Project Type</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Event Date</th>
                <th className="hidden px-4 py-3 font-semibold text-zinc-700 lg:table-cell">Budget</th>
                <th className="hidden px-4 py-3 font-semibold text-zinc-700 xl:table-cell">Message</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Status</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Draft</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-700">
                  <span className="sr-only">Delete</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {inquiries.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-sm text-zinc-500" colSpan={10}>
                    {error ? (
                      "Unable to load inquiries right now."
                    ) : showingArchived ? (
                      "No archived inquiries yet."
                    ) : (
                      <>
                        No inquiries yet. Send a client to{" "}
                        <a
                          href="/submit"
                          className="font-medium text-zinc-700 underline-offset-2 hover:underline"
                        >
                          /submit
                        </a>{" "}
                        — once they fill the form, the inquiry shows up here for
                        you to triage.
                      </>
                    )}
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
      )}
    </div>
    </AppShell>
  );
}
