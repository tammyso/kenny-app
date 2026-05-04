"use client";

import { useEffect, useState, useTransition } from "react";
import {
  deleteProspect,
  generateProspectDraft,
  markProspectStatus,
  saveProspectDraft,
  sendProspectDraft,
  type ProspectStatus,
} from "./actions";

export type ProspectData = {
  id: string;
  created_at: string;
  brand_name: string;
  contact_name: string | null;
  contact_email: string;
  fit_notes: string | null;
  draft_reply: string | null;
  draft_status: string | null;
  draft_generated_at: string | null;
  sent_at: string | null;
  status: string | null;
};

const toneClasses: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  zinc: "bg-zinc-100 text-zinc-700",
};

const statusBadge = (p: ProspectData) => {
  if (p.status === "retainer_signed")
    return { tone: "emerald", label: "Retainer signed" };
  if (p.status === "replied") return { tone: "blue", label: "Replied" };
  if (p.status === "declined") return { tone: "zinc", label: "Declined" };
  if (p.draft_status === "sent")
    return { tone: "blue", label: "Sent, waiting" };
  if (p.draft_status === "ready_to_send")
    return { tone: "amber", label: "Draft ready" };
  return { tone: "zinc", label: "New" };
};

export default function ProspectCard({ prospect }: { prospect: ProspectData }) {
  const isSent = prospect.draft_status === "sent";
  const [draftBody, setDraftBody] = useState(prospect.draft_reply ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isExpanded, setIsExpanded] = useState(
    prospect.draft_status === "ready_to_send",
  );

  useEffect(() => {
    setDraftBody(prospect.draft_reply ?? "");
  }, [prospect.draft_reply]);

  const runAction = (a: () => Promise<void>) => {
    setError(null);
    startTransition(async () => {
      try {
        await a();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  const handleGenerate = () => {
    setIsExpanded(true);
    runAction(() => generateProspectDraft(prospect.id));
  };

  const handleSave = () =>
    runAction(() => saveProspectDraft(prospect.id, draftBody));

  const handleSend = () => {
    if (!confirm(`Send this email to ${prospect.contact_email}?`)) return;
    runAction(() => sendProspectDraft(prospect.id, draftBody));
  };

  const handleMark = (status: ProspectStatus | null) => {
    runAction(() => markProspectStatus(prospect.id, status));
  };

  const handleDelete = () => {
    if (!confirm(`Delete prospect ${prospect.brand_name}? This can't be undone.`))
      return;
    runAction(() => deleteProspect(prospect.id));
  };

  const badge = statusBadge(prospect);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-900">
              {prospect.brand_name}
            </h3>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[badge.tone]}`}
            >
              {badge.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-700">
            {prospect.contact_name ? `${prospect.contact_name} · ` : ""}
            {prospect.contact_email}
          </p>
          {prospect.fit_notes && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">
              {prospect.fit_notes}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {!isSent && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isPending}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? "Drafting..."
                : prospect.draft_reply
                  ? "Regenerate"
                  : "Draft email"}
            </button>
          )}
          {(prospect.draft_reply || isSent) && (
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="text-xs font-medium text-zinc-600 underline-offset-2 hover:underline"
            >
              {isExpanded ? "Hide" : "View"} email
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-zinc-200 bg-zinc-50 p-4">
          {isSent ? (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Sent{" "}
                {prospect.sent_at &&
                  new Date(prospect.sent_at).toLocaleString()}
              </p>
              <pre className="whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white px-3 py-2 font-sans text-sm text-zinc-900">
                {prospect.draft_reply}
              </pre>
            </div>
          ) : prospect.draft_reply || draftBody ? (
            <textarea
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              rows={Math.max(8, draftBody.split("\n").length + 1)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-6 text-center text-sm text-zinc-500">
              {isPending ? "Drafting email with Claude..." : "No draft yet."}
            </p>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!isSent ? (
              <>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isPending || !draftBody.trim()}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Sending..." : "Send email"}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending || !draftBody.trim()}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleMark("replied")}
                  disabled={isPending || prospect.status === "replied"}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Mark replied
                </button>
                <button
                  type="button"
                  onClick={() => handleMark("declined")}
                  disabled={isPending || prospect.status === "declined"}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Mark declined
                </button>
                <button
                  type="button"
                  onClick={() => handleMark("retainer_signed")}
                  disabled={isPending || prospect.status === "retainer_signed"}
                  className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Retainer signed
                </button>
                {prospect.status && (
                  <button
                    type="button"
                    onClick={() => handleMark(null)}
                    disabled={isPending}
                    className="text-xs text-zinc-500 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Clear status
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="ml-auto rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
