"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  archiveInquiry,
  bookShoot,
  deleteInquiry,
  deliverShoot,
  generateDraft,
  refreshInvoiceStatus,
  saveDraft,
  sendDraft,
  sendInvoice,
  sendReviewRequest,
  trashDraft,
  unarchiveInquiry,
  updateInternalNotes,
} from "./actions";
import type { DayEvent } from "@/lib/google";

export type InquiryRowData = {
  id: string;
  created_at: string;
  client_name: string;
  client_email: string;
  project_type: string | null;
  event_date: string | null;
  budget_range: string | null;
  message: string | null;
  status: string | null;
  draft_reply: string | null;
  draft_status: string | null;
  draft_generated_at: string | null;
  sent_at: string | null;
  calendar_event_id: string | null;
  calendar_event_link: string | null;
  stripe_invoice_id: string | null;
  stripe_hosted_url: string | null;
  invoice_amount_cents: number | null;
  invoice_status: string | null;
  archived_at: string | null;
  internal_notes: string | null;
  triage_tag: string | null;
  triage_reason: string | null;
  client_research: string | null;
  client_references: { url: string; mediaType: string }[] | null;
  booked_at: string | null;
  invoice_sent_at: string | null;
  delivered_at: string | null;
  review_requested_at: string | null;
  pre_shoot_responses: Record<string, string> | null;
  pre_shoot_completed_at: string | null;
  deliverable_url: string | null;
};

function ActivityFeed({ inquiry }: { inquiry: InquiryRowData }) {
  const events: { label: string; at: string }[] = [
    { label: "Submitted", at: inquiry.created_at },
  ];
  if (inquiry.draft_generated_at)
    events.push({ label: "AI drafted reply", at: inquiry.draft_generated_at });
  if (inquiry.sent_at)
    events.push({ label: "Reply sent to client", at: inquiry.sent_at });
  if (inquiry.booked_at)
    events.push({ label: "Booked", at: inquiry.booked_at });
  if (inquiry.invoice_sent_at)
    events.push({ label: "Invoice sent", at: inquiry.invoice_sent_at });
  if (inquiry.delivered_at)
    events.push({ label: "Delivered", at: inquiry.delivered_at });
  if (inquiry.review_requested_at)
    events.push({
      label: "Review request sent",
      at: inquiry.review_requested_at,
    });

  if (events.length <= 1) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Activity
      </p>
      <ol className="space-y-1 text-sm text-zinc-700">
        {events.map((e, i) => (
          <li key={i} className="flex justify-between gap-4">
            <span>{e.label}</span>
            <span className="text-xs text-zinc-500">
              {new Date(e.at).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const displayDate = (value: string | null) => {
  if (!value) return "-";
  // For DATE columns ("YYYY-MM-DD"), parse as a calendar date — `new Date()`
  // would interpret it as UTC midnight and shift it backward a day in any
  // negative-UTC timezone, breaking the freebusy match on event_date.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

export default function InquiryRow({
  inquiry,
  events,
}: {
  inquiry: InquiryRowData;
  events: DayEvent[] | null;
}) {
  const isReady = inquiry.draft_status === "ready_to_send";
  const isSent = inquiry.draft_status === "sent";
  const isTrashed = inquiry.draft_status === "trashed";

  const [isExpanded, setIsExpanded] = useState(isReady);
  const [draftBody, setDraftBody] = useState(inquiry.draft_reply ?? "");
  const [notesBody, setNotesBody] = useState(inquiry.internal_notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDraftBody(inquiry.draft_reply ?? "");
  }, [inquiry.draft_reply]);

  useEffect(() => {
    setNotesBody(inquiry.internal_notes ?? "");
  }, [inquiry.internal_notes]);

  const isArchived = Boolean(inquiry.archived_at);
  const notesDirty = notesBody !== (inquiry.internal_notes ?? "");

  const runAction = (
    action: () => Promise<void>,
    successMessage?: string,
  ) => {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        if (successMessage) toast.success(successMessage);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        toast.error(msg);
      }
    });
  };

  const handleGenerate = () => {
    setIsExpanded(true);
    runAction(() => generateDraft(inquiry.id));
  };

  const handleSave = () => runAction(() => saveDraft(inquiry.id, draftBody));

  const handleSend = () => {
    if (!confirm(`Send this reply to ${inquiry.client_email}?`)) return;
    runAction(() => sendDraft(inquiry.id, draftBody), "Reply sent to client");
  };

  const handleTrash = () =>
    runAction(() => trashDraft(inquiry.id), "Draft trashed");

  const isBooked =
    inquiry.status === "booked" && Boolean(inquiry.calendar_event_link);

  const handleBook = () => {
    const projectLabel = inquiry.project_type ?? "shoot";
    const dateLabel = displayDate(inquiry.event_date);
    if (
      !confirm(
        `Book ${inquiry.client_name}'s ${projectLabel} on ${dateLabel}? This creates an event on your primary Google Calendar.`,
      )
    ) {
      return;
    }
    runAction(() => bookShoot(inquiry.id), "Shoot booked");
  };

  const handleSendInvoice = () => {
    const amountStr = prompt(
      `Invoice amount in dollars for ${inquiry.client_name} (e.g. 1500):`,
    );
    if (!amountStr) return;
    const amount = parseFloat(amountStr.replace(/[$,]/g, ""));
    if (Number.isNaN(amount) || amount <= 0) {
      alert("Enter a positive number.");
      return;
    }
    const defaultDescription = `${inquiry.project_type ?? "Videography"} — ${inquiry.client_name}, ${displayDate(inquiry.event_date)}`;
    const description = prompt(
      "Invoice line item description:",
      defaultDescription,
    );
    if (!description) return;
    runAction(
      () =>
        sendInvoice({
          inquiryId: inquiry.id,
          amountCents: Math.round(amount * 100),
          description,
        }),
      "Invoice sent",
    );
  };

  const handleRefreshInvoice = () =>
    runAction(() => refreshInvoiceStatus(inquiry.id));

  const handleSaveNotes = () =>
    runAction(() => updateInternalNotes(inquiry.id, notesBody));

  const handleArchive = () =>
    runAction(() => archiveInquiry(inquiry.id), "Archived");
  const handleUnarchive = () =>
    runAction(() => unarchiveInquiry(inquiry.id), "Restored");
  const handleDelete = () => {
    if (
      !confirm(
        `Permanently delete inquiry from ${inquiry.client_name}? This can't be undone.`,
      )
    ) {
      return;
    }
    runAction(() => deleteInquiry(inquiry.id), "Deleted");
  };

  const isPaid = inquiry.invoice_status === "paid";
  const isDelivered = Boolean(inquiry.delivered_at);
  const reviewRequested = Boolean(inquiry.review_requested_at);

  const handleMarkDelivered = () => {
    const url = prompt(
      "Paste the delivery link (Vimeo, YouTube, Frame.io, Drive, etc.):",
      inquiry.deliverable_url ?? "",
    );
    if (!url || !url.trim()) return;
    runAction(() => deliverShoot(inquiry.id, url), "Marked delivered");
  };

  const handleSendReview = () => {
    if (
      !confirm(
        `Send a review-request email to ${inquiry.client_name} at ${inquiry.client_email}?`,
      )
    ) {
      return;
    }
    runAction(() => sendReviewRequest(inquiry.id), "Review request sent");
  };

  return (
    <>
      <tr className={`align-top ${isArchived ? "opacity-60" : ""}`}>
        <td className="hidden px-4 py-3 text-zinc-700 lg:table-cell">
          {displayDate(inquiry.created_at)}
        </td>
        <td className="px-4 py-3 font-medium text-zinc-900">
          <div className="flex flex-col gap-1">
            <span>{inquiry.client_name}</span>
            {inquiry.triage_tag === "flagged" && (
              <span
                title={inquiry.triage_reason ?? undefined}
                className="inline-flex w-fit items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
              >
                Flagged
              </span>
            )}
            {inquiry.triage_tag === "low_value" && (
              <span
                title={inquiry.triage_reason ?? undefined}
                className="inline-flex w-fit items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
              >
                Low priority
              </span>
            )}
          </div>
        </td>
        <td className="hidden px-4 py-3 text-zinc-700 lg:table-cell">{inquiry.client_email}</td>
        <td className="hidden px-4 py-3 text-zinc-700 sm:table-cell">
          {inquiry.project_type || "-"}
        </td>
        <td className="px-4 py-3 text-zinc-700">
          <div className="flex flex-col gap-1">
            <span>{displayDate(inquiry.event_date)}</span>
            {isBooked ? (
              <a
                href={inquiry.calendar_event_link!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 underline-offset-2 hover:underline"
              >
                Booked
              </a>
            ) : (
              <>
                {events && events.length === 0 && (
                  <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Free
                  </span>
                )}
                {events && events.length > 0 && (
                  <ul className="space-y-0.5 text-xs text-zinc-600">
                    {events.map((e, i) => (
                      <li key={i} className="flex gap-1">
                        <span className="text-zinc-400">•</span>
                        <span>
                          {e.title}
                          <span className="text-zinc-400"> · {e.timeLabel}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {events && inquiry.event_date && (
                  <button
                    type="button"
                    onClick={handleBook}
                    disabled={isPending}
                    className="inline-flex w-fit items-center rounded-md border border-zinc-300 bg-white px-2 py-0.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "Booking..." : "Book shoot"}
                  </button>
                )}
              </>
            )}
          </div>
        </td>
        <td className="hidden px-4 py-3 text-zinc-700 lg:table-cell">
          {inquiry.budget_range || "-"}
        </td>
        <td className="hidden max-w-xs px-4 py-3 text-zinc-700 xl:table-cell">
          {inquiry.message || "-"}
        </td>
        <td className="px-4 py-3 text-zinc-700">
          <div className="flex flex-col gap-1">
            <span>{inquiry.status || "new"}</span>
            {isBooked && !inquiry.stripe_invoice_id && (
              <button
                type="button"
                onClick={handleSendInvoice}
                disabled={isPending}
                className="inline-flex w-fit items-center rounded-md border border-zinc-300 bg-white px-2 py-0.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Sending..." : "Send invoice"}
              </button>
            )}
            {inquiry.stripe_invoice_id && (
              <div className="flex flex-col gap-0.5 text-xs">
                <a
                  href={inquiry.stripe_hosted_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-700 underline-offset-2 hover:underline"
                >
                  ${((inquiry.invoice_amount_cents ?? 0) / 100).toFixed(0)} ·{" "}
                  {inquiry.invoice_status ?? "open"}
                </a>
                <button
                  type="button"
                  onClick={handleRefreshInvoice}
                  disabled={isPending}
                  className="w-fit text-zinc-500 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Refreshing..." : "Refresh status"}
                </button>
              </div>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          {isSent ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                Sent
              </span>
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="text-sm font-medium text-zinc-700 underline-offset-2 hover:underline"
              >
                {isExpanded ? "Hide" : "View"}
              </button>
            </div>
          ) : isReady ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Ready
              </span>
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="text-sm font-medium text-zinc-700 underline-offset-2 hover:underline"
              >
                {isExpanded ? "Hide" : "View"}
              </button>
            </div>
          ) : isTrashed ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Trashed</span>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isPending}
                className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Drafting..." : "Re-draft"}
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="text-xs font-medium text-zinc-600 underline-offset-2 hover:underline"
              >
                {isExpanded ? "Hide" : "View"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isPending}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Drafting..." : "Draft reply"}
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="text-xs font-medium text-zinc-600 underline-offset-2 hover:underline"
              >
                {isExpanded ? "Hide" : "View"}
              </button>
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            aria-label={`Delete inquiry from ${inquiry.client_name}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden
            >
              <path d="M5.5 1a.5.5 0 0 0-.5.5V2H2.5a.5.5 0 0 0 0 1h.538l.804 10.034A1.5 1.5 0 0 0 5.337 14.5h5.327a1.5 1.5 0 0 0 1.495-1.466L12.962 3H13.5a.5.5 0 0 0 0-1H11v-.5a.5.5 0 0 0-.5-.5h-5zM6 2h4v.5H6V2zm.46 3a.5.5 0 0 1 .54.46l.5 6a.5.5 0 1 1-1 .08l-.5-6A.5.5 0 0 1 6.46 5zm3.08 0a.5.5 0 0 1 .46.54l-.5 6a.5.5 0 1 1-1-.08l.5-6a.5.5 0 0 1 .54-.46z" />
            </svg>
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-zinc-50">
          <td colSpan={10} className="px-4 py-4">
            <div className="space-y-4">
              <ActivityFeed inquiry={inquiry} />

              {inquiry.client_references && inquiry.client_references.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Client&apos;s reference images
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {inquiry.client_references.map((ref, i) => (
                      <a
                        key={ref.url}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ref.url}
                          alt={`Client reference ${i + 1}`}
                          className="aspect-square w-full rounded-md border border-zinc-200 object-cover transition hover:opacity-80"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {inquiry.client_research && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    AI client research
                  </p>
                  <p className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                    {inquiry.client_research}
                  </p>
                </div>
              )}

              {inquiry.pre_shoot_responses && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Pre-shoot details from client
                  </p>
                  <dl className="space-y-2 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm">
                    {Object.entries(inquiry.pre_shoot_responses)
                      .filter(([, v]) => v && String(v).trim())
                      .map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            {key.replace(/_/g, " ")}
                          </dt>
                          <dd className="mt-0.5 whitespace-pre-wrap text-zinc-800">
                            {value}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </div>
              )}

              {inquiry.deliverable_url && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Delivery link
                  </p>
                  <a
                    href={inquiry.deliverable_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-blue-700 underline-offset-2 hover:underline"
                  >
                    {inquiry.deliverable_url}
                  </a>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Internal notes (only visible here)
                  </p>
                  {notesDirty && (
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={isPending}
                      className="text-xs font-medium text-blue-700 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPending ? "Saving..." : "Save notes"}
                    </button>
                  )}
                </div>
                <textarea
                  value={notesBody}
                  onChange={(e) => setNotesBody(e.target.value)}
                  onBlur={() => {
                    if (notesDirty) handleSaveNotes();
                  }}
                  rows={2}
                  placeholder="Triage thoughts: referral source, red flags, anything Kenny should remember when responding."
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {isSent
                    ? `Sent reply to ${inquiry.client_name}`
                    : `AI draft reply to ${inquiry.client_name}`}
                </p>
                {isSent && inquiry.sent_at ? (
                  <p className="text-xs text-zinc-500">
                    Sent {new Date(inquiry.sent_at).toLocaleString()}
                  </p>
                ) : inquiry.draft_generated_at ? (
                  <p className="text-xs text-zinc-500">
                    Generated {new Date(inquiry.draft_generated_at).toLocaleString()}
                  </p>
                ) : null}
              </div>

              {isSent ? (
                <pre className="w-full whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white px-3 py-2 font-sans text-sm text-zinc-900">
                  {inquiry.draft_reply}
                </pre>
              ) : isReady || draftBody ? (
                <textarea
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  rows={Math.max(6, draftBody.split("\n").length + 1)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              ) : (
                <p className="rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-6 text-center text-sm text-zinc-500">
                  {isPending
                    ? "Drafting reply with Claude..."
                    : "No draft yet."}
                </p>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex flex-wrap items-center gap-2">
                {!isSent && (
                  <>
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={isPending || !draftBody.trim()}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPending ? "Sending..." : "Send to client"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isPending || !draftBody.trim()}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPending ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isPending}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPending ? "Drafting..." : "Regenerate"}
                    </button>
                    <button
                      type="button"
                      onClick={handleTrash}
                      disabled={isPending || !inquiry.draft_reply}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Trash
                    </button>
                  </>
                )}
                {isPaid && !isDelivered && (
                  <button
                    type="button"
                    onClick={handleMarkDelivered}
                    disabled={isPending}
                    className="ml-auto rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Mark delivered
                  </button>
                )}
                {isDelivered && !reviewRequested && (
                  <button
                    type="button"
                    onClick={handleSendReview}
                    disabled={isPending}
                    className="ml-auto rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "Sending..." : "Send review request"}
                  </button>
                )}
                {reviewRequested && (
                  <span className="ml-auto inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                    Review requested
                  </span>
                )}
                <button
                  type="button"
                  onClick={isArchived ? handleUnarchive : handleArchive}
                  disabled={isPending}
                  className={`rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60${isPaid || isDelivered || reviewRequested ? "" : " ml-auto"}`}
                >
                  {isArchived ? "Unarchive" : "Archive"}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Close
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
