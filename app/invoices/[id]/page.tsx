import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isCalendarConnected } from "@/lib/google";
import AppShell from "../../app-shell";
import InvoiceActions from "./invoice-actions";
import type { LineItem } from "../actions";

export const metadata: Metadata = { title: "Invoice" };

type InvoiceRow = {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  event_date: string | null;
  event_location: string | null;
  event_time: string | null;
  line_items: LineItem[];
  discount_amount: number;
  subtotal: number;
  total: number;
  payment_type: string;
  retainer_amount: number;
  retainer_due_date: string | null;
  balance_due_date: string | null;
  status: string;
  stripe_retainer_url: string | null;
  stripe_balance_url: string | null;
  sent_at: string | null;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-600",
  sent: "bg-blue-50 text-blue-700",
  retainer_paid: "bg-amber-50 text-amber-700",
  paid_in_full: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  retainer_paid: "Retainer Paid",
  paid_in_full: "Paid in Full",
  cancelled: "Cancelled",
};

const fmt = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const calendarConnected = await isCalendarConnected();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single<InvoiceRow>();

  if (!invoice) notFound();

  return (
    <AppShell calendarConnected={calendarConnected}>
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link
              href="/invoices"
              className="mb-2 inline-flex text-xs text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline"
            >
              ← All invoices
            </Link>
            <h1 className="text-3xl font-semibold text-zinc-900">
              Invoice #{invoice.invoice_number}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[invoice.status] ?? "bg-zinc-100 text-zinc-600"}`}
              >
                {STATUS_LABELS[invoice.status] ?? invoice.status}
              </span>
              <span className="text-xs text-zinc-400">
                Created{" "}
                {new Date(invoice.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {invoice.status === "draft" && (
              <Link
                href={`/invoices/${invoice.id}/edit`}
                className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Edit
              </Link>
            )}
            <Link
              href={`/invoices/${invoice.id}/print`}
              target="_blank"
              className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Print / PDF
            </Link>
          </div>
        </div>

        {/* Client + event */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
              Bill To
            </p>
            <p className="font-medium text-zinc-900">{invoice.client_name}</p>
            <p className="text-sm text-zinc-500">{invoice.client_email}</p>
            {invoice.client_phone && (
              <p className="text-sm text-zinc-500">{invoice.client_phone}</p>
            )}
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
              Event
            </p>
            {invoice.event_date ? (
              <p className="font-medium text-zinc-900">{invoice.event_date}</p>
            ) : (
              <p className="text-sm text-zinc-400">No date set</p>
            )}
            {invoice.event_time && (
              <p className="text-sm text-zinc-500">{invoice.event_time}</p>
            )}
            {invoice.event_location && (
              <p className="text-sm text-zinc-500">{invoice.event_location}</p>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="mb-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {invoice.line_items.map((item, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-zinc-700">{item.description}</td>
                  <td className="px-4 py-3 text-center text-zinc-500">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-500">
                    {fmt(item.unitPrice * 100)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-900">
                    {fmt(item.quantity * item.unitPrice * 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-zinc-100 px-4 py-4 text-sm">
            <div className="space-y-1.5">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span>{fmt(invoice.subtotal)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-zinc-500">
                  <span>Discount</span>
                  <span>−{fmt(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-zinc-900">
                <span>Total</span>
                <span>{fmt(invoice.total)}</span>
              </div>
              {invoice.payment_type === "retainer" && (
                <>
                  <div className="flex justify-between text-zinc-500">
                    <span>
                      30% Retainer
                      {invoice.retainer_due_date
                        ? ` (due ${invoice.retainer_due_date})`
                        : ""}
                    </span>
                    <span>{fmt(invoice.retainer_amount)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>
                      Balance
                      {invoice.balance_due_date
                        ? ` (due ${invoice.balance_due_date})`
                        : ""}
                    </span>
                    <span>{fmt(invoice.total - invoice.retainer_amount)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Payment links */}
        {(invoice.stripe_retainer_url || invoice.stripe_balance_url) && (
          <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
              Payment Links
            </p>
            <div className="space-y-2">
              {invoice.stripe_retainer_url && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">
                    {invoice.payment_type === "retainer"
                      ? "30% Retainer"
                      : "Pay in Full"}
                  </span>
                  <a
                    href={invoice.stripe_retainer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-600 underline-offset-2 hover:underline"
                  >
                    Open payment link →
                  </a>
                </div>
              )}
              {invoice.stripe_balance_url && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Remaining Balance</span>
                  <a
                    href={invoice.stripe_balance_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-600 underline-offset-2 hover:underline"
                  >
                    Open payment link →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <InvoiceActions invoice={invoice} />
      </div>
    </AppShell>
  );
}
