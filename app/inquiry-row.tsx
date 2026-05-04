"use client";

import { useEffect, useState, useTransition } from "react";
import { generateDraft, saveDraft, sendDraft, trashDraft } from "./actions";

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
};

const displayDate = (value: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

export default function InquiryRow({ inquiry }: { inquiry: InquiryRowData }) {
  const isReady = inquiry.draft_status === "ready_to_send";
  const isSent = inquiry.draft_status === "sent";
  const isTrashed = inquiry.draft_status === "trashed";

  const [isExpanded, setIsExpanded] = useState(isReady);
  const [draftBody, setDraftBody] = useState(inquiry.draft_reply ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDraftBody(inquiry.draft_reply ?? "");
  }, [inquiry.draft_reply]);

  const runAction = (action: () => Promise<void>) => {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
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
    runAction(() => sendDraft(inquiry.id, draftBody));
  };

  const handleTrash = () => runAction(() => trashDraft(inquiry.id));

  return (
    <>
      <tr className="align-top">
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
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isPending}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Drafting..." : "Draft reply"}
            </button>
          )}
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-zinc-50">
          <td colSpan={9} className="px-4 py-4">
            <div className="space-y-3">
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
                {isSent ? (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="ml-auto text-sm text-zinc-600 hover:text-zinc-900"
                  >
                    Close
                  </button>
                ) : (
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
                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      className="ml-auto text-sm text-zinc-600 hover:text-zinc-900"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
