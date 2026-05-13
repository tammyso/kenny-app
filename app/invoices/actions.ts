"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createPaymentLink } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site-url";

const requireUser = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");
  return supabase;
};

export type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number; // dollars
};

const fmt = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

export async function createInvoice(args: {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  eventDate?: string;
  eventLocation?: string;
  eventTime?: string;
  lineItems: LineItem[];
  discountDollars: number;
  paymentType: "retainer" | "full";
  retainerDueDate?: string;
  balanceDueDate?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await requireUser();

  const subtotalCents = args.lineItems.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPrice * 100),
    0,
  );
  const discountCents = Math.round(args.discountDollars * 100);
  const totalCents = Math.max(0, subtotalCents - discountCents);
  const retainerCents = Math.round(totalCents * 0.3);

  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true });
  const invoiceNumber = String((count ?? 0) + 198).padStart(5, "0");

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      client_name: args.clientName,
      client_email: args.clientEmail,
      client_phone: args.clientPhone || null,
      event_date: args.eventDate || null,
      event_location: args.eventLocation || null,
      event_time: args.eventTime || null,
      line_items: args.lineItems,
      discount_amount: discountCents,
      subtotal: subtotalCents,
      total: totalCents,
      payment_type: args.paymentType,
      retainer_amount: retainerCents,
      retainer_due_date: args.retainerDueDate || null,
      balance_due_date: args.balanceDueDate || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Invoice create error:", error);
    return { ok: false, error: "Failed to create invoice" };
  }

  revalidatePath("/invoices");
  return { ok: true, id: data.id as string };
}

type InvoiceRow = {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  event_date: string | null;
  line_items: LineItem[];
  discount_amount: number;
  subtotal: number;
  total: number;
  payment_type: string;
  retainer_amount: number;
  balance_due_date: string | null;
  status: string;
  stripe_retainer_url: string | null;
  stripe_balance_url: string | null;
};

export async function sendInvoiceEmail(
  invoiceId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await requireUser();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single<InvoiceRow>();

  if (error || !invoice) return { ok: false, error: "Invoice not found" };

  let retainerUrl = invoice.stripe_retainer_url;
  let balanceUrl = invoice.stripe_balance_url;

  if (!retainerUrl) {
    try {
      if (invoice.payment_type === "retainer") {
        retainerUrl = await createPaymentLink({
          amountCents: invoice.retainer_amount,
          description: `Invoice #${invoice.invoice_number} — 30% Retainer`,
        });
        const balanceCents = invoice.total - invoice.retainer_amount;
        if (balanceCents > 0) {
          balanceUrl = await createPaymentLink({
            amountCents: balanceCents,
            description: `Invoice #${invoice.invoice_number} — Remaining Balance`,
          });
        }
      } else {
        retainerUrl = await createPaymentLink({
          amountCents: invoice.total,
          description: `Invoice #${invoice.invoice_number} — Payment in Full`,
        });
      }
    } catch (stripeErr) {
      console.error("Stripe payment link failed:", stripeErr);
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const printUrl = `${getSiteUrl()}/invoices/${invoiceId}/print`;
      const firstName = invoice.client_name.split(" ")[0] ?? invoice.client_name;

      const lines: string[] = [
        `Hi ${firstName},`,
        "",
        "Here is your invoice from Oak One Eight Visualz.",
        "",
        `Invoice #${invoice.invoice_number}`,
        ...(invoice.event_date ? [`Event date: ${invoice.event_date}`] : []),
        `Total: ${fmt(invoice.total)}`,
        "",
      ];

      if (invoice.payment_type === "retainer") {
        lines.push(`30% Retainer due now: ${fmt(invoice.retainer_amount)}`);
        if (retainerUrl) lines.push(`Pay retainer: ${retainerUrl}`);
        lines.push(
          "",
          `Remaining balance: ${fmt(invoice.total - invoice.retainer_amount)}`,
        );
        if (invoice.balance_due_date)
          lines.push(`Balance due: ${invoice.balance_due_date}`);
        if (balanceUrl) lines.push(`Pay balance: ${balanceUrl}`);
      } else {
        lines.push(`Amount due: ${fmt(invoice.total)}`);
        if (retainerUrl) lines.push(`Pay now: ${retainerUrl}`);
      }

      lines.push(
        "",
        `View full invoice: ${printUrl}`,
        "",
        "Thank you,",
        "Kenny — Oak One Eight Visualz",
        "646-784-0680 | oakoneeight@gmail.com",
      );

      await resend.emails.send({
        from: "Kenny <onboarding@resend.dev>",
        to: invoice.client_email,
        subject: `Invoice #${invoice.invoice_number} — Oak One Eight Visualz`,
        text: lines.join("\n"),
      });
    } catch (emailErr) {
      console.error("Invoice email failed:", emailErr);
    }
  }

  await supabase
    .from("invoices")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      stripe_retainer_url: retainerUrl,
      stripe_balance_url: balanceUrl,
    })
    .eq("id", invoiceId);

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  return { ok: true };
}

export async function markRetainerPaid(invoiceId: string) {
  const supabase = await requireUser();
  await supabase
    .from("invoices")
    .update({ status: "retainer_paid" })
    .eq("id", invoiceId);
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function markPaidInFull(invoiceId: string) {
  const supabase = await requireUser();
  await supabase
    .from("invoices")
    .update({ status: "paid_in_full" })
    .eq("id", invoiceId);
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function deleteInvoice(invoiceId: string) {
  const supabase = await requireUser();
  await supabase.from("invoices").delete().eq("id", invoiceId);
  revalidatePath("/invoices");
  redirect("/invoices");
}
