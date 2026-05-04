import type { InquiryRowData } from "./inquiry-row";

type Stage = "new" | "drafted" | "sent" | "booked" | "paid";

const STAGE_LABELS: Record<Stage, string> = {
  new: "New",
  drafted: "Draft ready",
  sent: "Sent, waiting",
  booked: "Booked",
  paid: "Paid",
};

const STAGE_ORDER: Stage[] = ["new", "drafted", "sent", "booked", "paid"];

const STAGE_COLORS: Record<Stage, string> = {
  new: "bg-zinc-100 text-zinc-700",
  drafted: "bg-amber-50 text-amber-800",
  sent: "bg-blue-50 text-blue-800",
  booked: "bg-emerald-50 text-emerald-800",
  paid: "bg-violet-50 text-violet-800",
};

const getStage = (i: InquiryRowData): Stage => {
  if (i.invoice_status === "paid") return "paid";
  if (i.status === "booked") return "booked";
  if (i.draft_status === "sent") return "sent";
  if (i.draft_status === "ready_to_send") return "drafted";
  return "new";
};

const formatEventDate = (value: string | null) => {
  if (!value) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, , month, day] = dateOnly;
    return `${parseInt(month, 10)}/${parseInt(day, 10)}`;
  }
  return value;
};

export default function DashboardBoard({
  inquiries,
}: {
  inquiries: InquiryRowData[];
}) {
  const grouped: Record<Stage, InquiryRowData[]> = {
    new: [],
    drafted: [],
    sent: [],
    booked: [],
    paid: [],
  };
  for (const inquiry of inquiries) {
    grouped[getStage(inquiry)].push(inquiry);
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[64rem] grid-cols-5 gap-4">
        {STAGE_ORDER.map((stage) => (
          <section key={stage} className="space-y-3">
            <header className="flex items-center justify-between">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[stage]}`}
              >
                {STAGE_LABELS[stage]}
              </span>
              <span className="text-xs font-medium text-zinc-500">
                {grouped[stage].length}
              </span>
            </header>
            <div className="space-y-2">
              {grouped[stage].length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-200 bg-white px-3 py-6 text-center text-xs text-zinc-400">
                  None
                </p>
              ) : (
                grouped[stage].map((inquiry) => {
                  const eventLabel = formatEventDate(inquiry.event_date);
                  const isFlagged = inquiry.triage_tag === "flagged";
                  const isLowPriority = inquiry.triage_tag === "low_value";
                  return (
                    <a
                      key={inquiry.id}
                      href={`/?view=list#inquiry-${inquiry.id}`}
                      className="block rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-zinc-400 hover:shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-zinc-900">
                          {inquiry.client_name}
                        </p>
                        {isFlagged && (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                            Flagged
                          </span>
                        )}
                        {!isFlagged && isLowPriority && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            Low priority
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-600">
                        {inquiry.project_type ?? "—"}
                        {eventLabel ? ` · ${eventLabel}` : ""}
                      </p>
                      {inquiry.budget_range && (
                        <p className="mt-1 text-xs text-zinc-500">
                          {inquiry.budget_range}
                        </p>
                      )}
                      {inquiry.invoice_amount_cents !== null && (
                        <p className="mt-2 text-xs font-medium text-zinc-700">
                          $
                          {(
                            (inquiry.invoice_amount_cents ?? 0) / 100
                          ).toLocaleString()}
                          {inquiry.invoice_status
                            ? ` · ${inquiry.invoice_status}`
                            : ""}
                        </p>
                      )}
                    </a>
                  );
                })
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
