"use client";

import { useState, useTransition } from "react";
import {
  sendInvoiceEmail,
  markRetainerPaid,
  markPaidInFull,
  deleteInvoice,
} from "../actions";

type InvoiceSummary = {
  id: string;
  status: string;
  payment_type: string;
};

export default function InvoiceActions({
  invoice,
}: {
  invoice: InvoiceSummary;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    startTransition(async () => {
      const result = await sendInvoiceEmail(invoice.id);
      if (!result.ok) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  };

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {sent && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Invoice sent to client.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {invoice.status === "draft" && (
          <button
            type="button"
            onClick={handleSend}
            disabled={isPending}
            className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
          >
            {isPending ? "Sending…" : "Send to Client"}
          </button>
        )}

        {invoice.status === "sent" && invoice.payment_type === "retainer" && (
          <form
            action={async () => {
              startTransition(() => markRetainerPaid(invoice.id));
            }}
          >
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-9 items-center rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
            >
              Mark Retainer Paid
            </button>
          </form>
        )}

        {(invoice.status === "sent" || invoice.status === "retainer_paid") && (
          <form
            action={async () => {
              startTransition(() => markPaidInFull(invoice.id));
            }}
          >
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-9 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              Mark Paid in Full
            </button>
          </form>
        )}

        {invoice.status === "draft" && (
          <form
            action={async () => {
              if (!confirm("Delete this invoice? This cannot be undone.")) return;
              startTransition(() => deleteInvoice(invoice.id));
            }}
          >
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
              Delete
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
