import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isCalendarConnected } from "@/lib/google";
import AppShell from "../../../app-shell";
import EditInvoiceForm from "./edit-form";
import type { LineItem } from "../../actions";

export const metadata: Metadata = { title: "Edit Invoice" };

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
  payment_type: string;
  retainer_due_date: string | null;
  balance_due_date: string | null;
  status: string;
};

export default async function EditInvoicePage({
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
    .select(
      "id, invoice_number, client_name, client_email, client_phone, event_date, event_location, event_time, line_items, discount_amount, payment_type, retainer_due_date, balance_due_date, status",
    )
    .eq("id", id)
    .single<InvoiceRow>();

  if (!invoice) notFound();

  // Only draft invoices can be edited — sent invoices already have payment links generated.
  if (invoice.status !== "draft") redirect(`/invoices/${id}`);

  return (
    <AppShell calendarConnected={calendarConnected}>
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="mb-8">
          <Link
            href={`/invoices/${id}`}
            className="mb-2 inline-flex text-xs text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline"
          >
            ← Invoice #{invoice.invoice_number}
          </Link>
          <h1 className="text-3xl font-semibold text-zinc-900">Edit Invoice</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Only draft invoices can be edited. Once sent, line items are locked.
          </p>
        </div>
        <EditInvoiceForm invoiceId={id} invoice={invoice} />
      </div>
    </AppShell>
  );
}
