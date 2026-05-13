import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isCalendarConnected } from "@/lib/google";
import AppShell from "../app-shell";

export const metadata: Metadata = { title: "Invoices" };

type InvoiceRow = {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  event_date: string | null;
  total: number;
  payment_type: string;
  status: string;
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

export default async function InvoicesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const calendarConnected = await isCalendarConnected();

  const { data } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, client_name, client_email, event_date, total, payment_type, status, created_at",
    )
    .order("created_at", { ascending: false });

  const invoices: InvoiceRow[] = data ?? [];

  return (
    <AppShell calendarConnected={calendarConnected}>
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">Invoices</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/invoices/new"
            className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            + New Invoice
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-14 text-center">
            <p className="text-sm text-zinc-500">No invoices yet.</p>
            <Link
              href="/invoices/new"
              className="mt-4 inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Event Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                      #{inv.invoice_number}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{inv.client_name}</p>
                      <p className="text-xs text-zinc-400">{inv.client_email}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {inv.event_date ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {fmt(inv.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[inv.status] ?? "bg-zinc-100 text-zinc-600"}`}
                      >
                        {STATUS_LABELS[inv.status] ?? inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
