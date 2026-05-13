import { notFound } from "next/navigation";
import Image from "next/image";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { LineItem } from "../../actions";

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
  created_at: string;
};

const fmt = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export default async function PrintInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single<InvoiceRow>();

  if (!invoice) notFound();

  const balanceCents = invoice.total - invoice.retainer_amount;

  return (
    <html lang="en">
      <head>
        <title>Invoice #{invoice.invoice_number} — Oak One Eight Visualz</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111; font-size: 13px; }
          .page { max-width: 760px; margin: 0 auto; padding: 48px 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #111; padding-bottom: 20px; }
          .biz { display: flex; align-items: center; gap: 16px; }
          .biz-details p { line-height: 1.6; font-size: 13px; color: #333; }
          .biz-details strong { font-size: 16px; color: #111; }
          .title { font-size: 20px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; text-align: right; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
          .bill-to { background: #f8f8f8; border-left: 3px solid #111; padding: 12px 16px; }
          .bill-to .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #666; margin-bottom: 6px; }
          .bill-to p { line-height: 1.5; }
          .invoice-meta { text-align: right; }
          .invoice-meta table { margin-left: auto; }
          .invoice-meta td { padding: 2px 0 2px 16px; }
          .invoice-meta td:first-child { color: #666; }
          .invoice-meta td:last-child { font-weight: 600; }
          table.items { width: 100%; border-collapse: collapse; margin-bottom: 0; }
          table.items th { background: #111; color: #fff; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; }
          table.items th.right { text-align: right; }
          table.items td { padding: 10px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
          table.items td.right { text-align: right; }
          table.items tr:last-child td { border-bottom: none; }
          .totals { margin-left: auto; width: 280px; margin-top: 0; border-top: 1px solid #eee; }
          .totals tr td { padding: 5px 12px; }
          .totals tr td:last-child { text-align: right; }
          .totals tr.total-row td { font-weight: 700; font-size: 14px; border-top: 2px solid #111; padding-top: 8px; }
          .totals tr.sub td { color: #555; font-size: 12px; }
          .payment { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .payment-section { border: 1px solid #ddd; border-radius: 6px; padding: 14px; }
          .payment-section h3 { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #666; margin-bottom: 8px; }
          .payment-section p { font-size: 12px; line-height: 1.6; color: #333; word-break: break-all; }
          .payment-section .amount { font-size: 18px; font-weight: 700; color: #111; margin-bottom: 4px; }
          .payment-section .due { font-size: 11px; color: #888; margin-bottom: 8px; }
          .payment-link { display: inline-block; margin-top: 8px; font-size: 11px; color: #1a56db; word-break: break-all; }
          .terms { margin-top: 24px; background: #f8f8f8; border-radius: 6px; padding: 14px 16px; font-size: 11px; color: #555; line-height: 1.7; }
          .sig { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .sig-line { border-top: 1px solid #333; padding-top: 6px; font-size: 11px; color: #666; }
          .print-btn { position: fixed; bottom: 24px; right: 24px; background: #111; color: #fff; border: none; border-radius: 8px; padding: 10px 18px; font-size: 13px; font-weight: 600; cursor: pointer; }
          @media print { .print-btn { display: none; } body { font-size: 12px; } .page { padding: 24px; } }
        `}</style>
      </head>
      <body>
        <div className="page">
          {/* Header */}
          <div className="header">
            <div className="biz">
              <Image
                src="/logo.png"
                alt="Oak One Eight Visualz"
                width={64}
                height={64}
                className="invert"
                style={{ filter: "invert(1)" }}
              />
              <div className="biz-details">
                <p><strong>OAK ONE EIGHT, LLC</strong></p>
                <p>Elmont, New York 11003</p>
                <p>646-784-0680</p>
                <p>oakoneeight@gmail.com</p>
              </div>
            </div>
            <div>
              <div className="title">Invoice</div>
              <p style={{ textAlign: "right", marginTop: 4, color: "#666", fontSize: 12 }}>
                #{invoice.invoice_number}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="meta">
            <div className="bill-to">
              <div className="label">Bill To</div>
              <p style={{ fontWeight: 600 }}>{invoice.client_name}</p>
              <p>{invoice.client_email}</p>
              {invoice.client_phone && <p>{invoice.client_phone}</p>}
              {invoice.event_location && (
                <p style={{ marginTop: 6 }}>{invoice.event_location}</p>
              )}
              {invoice.event_time && <p>{invoice.event_time}</p>}
            </div>
            <div className="invoice-meta">
              <table>
                <tbody>
                  <tr>
                    <td>Date</td>
                    <td>{formatDate(invoice.created_at)}</td>
                  </tr>
                  <tr>
                    <td>Invoice #</td>
                    <td>{invoice.invoice_number}</td>
                  </tr>
                  {invoice.event_date && (
                    <tr>
                      <td>Event Date</td>
                      <td>{invoice.event_date}</td>
                    </tr>
                  )}
                  {invoice.retainer_due_date && (
                    <tr>
                      <td>Retainer Due</td>
                      <td style={{ color: "#c00" }}>{invoice.retainer_due_date}</td>
                    </tr>
                  )}
                  {invoice.balance_due_date && (
                    <tr>
                      <td>Balance Due</td>
                      <td style={{ color: "#c00" }}>{invoice.balance_due_date}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Line items */}
          <table className="items">
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ width: 60, textAlign: "center" }}>Qty</th>
                <th className="right" style={{ width: 110 }}>Unit Price</th>
                <th className="right" style={{ width: 110 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items.map((item, i) => (
                <tr key={i}>
                  <td>{item.description}</td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td className="right">{fmt(item.unitPrice * 100)}</td>
                  <td className="right">{fmt(item.quantity * item.unitPrice * 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <table className="totals">
            <tbody>
              <tr className="sub">
                <td>Subtotal</td>
                <td>{fmt(invoice.subtotal)}</td>
              </tr>
              {invoice.discount_amount > 0 && (
                <tr className="sub">
                  <td>Discount</td>
                  <td>−{fmt(invoice.discount_amount)}</td>
                </tr>
              )}
              <tr className="total-row">
                <td>Total Investment</td>
                <td>{fmt(invoice.total)}</td>
              </tr>
            </tbody>
          </table>

          {/* Payment sections */}
          <div className="payment">
            {invoice.payment_type === "retainer" ? (
              <>
                <div className="payment-section">
                  <h3>30% Retainer — Due Now</h3>
                  <div className="amount">{fmt(invoice.retainer_amount)}</div>
                  {invoice.retainer_due_date && (
                    <div className="due">Due: {invoice.retainer_due_date}</div>
                  )}
                  <p>Non-refundable. Secures your date upon signing.</p>
                  {invoice.stripe_retainer_url && (
                    <a href={invoice.stripe_retainer_url} className="payment-link">
                      Pay online → {invoice.stripe_retainer_url}
                    </a>
                  )}
                  <p style={{ marginTop: 8 }}>
                    Zelle: oakoneeight@gmail.com<br />
                    Check payable to: OAK ONE EIGHT LLC
                  </p>
                </div>
                <div className="payment-section">
                  <h3>Remaining Balance</h3>
                  <div className="amount">{fmt(balanceCents)}</div>
                  {invoice.balance_due_date && (
                    <div className="due">Due: {invoice.balance_due_date}</div>
                  )}
                  <p>Due 14 days prior to event.</p>
                  {invoice.stripe_balance_url && (
                    <a href={invoice.stripe_balance_url} className="payment-link">
                      Pay online → {invoice.stripe_balance_url}
                    </a>
                  )}
                  <p style={{ marginTop: 8 }}>
                    Zelle: oakoneeight@gmail.com<br />
                    Check payable to: OAK ONE EIGHT LLC
                  </p>
                </div>
              </>
            ) : (
              <div className="payment-section" style={{ gridColumn: "span 2" }}>
                <h3>Payment in Full</h3>
                <div className="amount">{fmt(invoice.total)}</div>
                <p>Due upon signing.</p>
                {invoice.stripe_retainer_url && (
                  <a href={invoice.stripe_retainer_url} className="payment-link">
                    Pay online → {invoice.stripe_retainer_url}
                  </a>
                )}
                <p style={{ marginTop: 8 }}>
                  Zelle: oakoneeight@gmail.com<br />
                  Check payable to: OAK ONE EIGHT LLC
                </p>
              </div>
            )}
          </div>

          {/* Terms */}
          <div className="terms">
            All pricing is based on equipment used, physical shoot time, travel expenses, and editing time. Travel time of 1 hour or more increases the overall total fee. 30% non-refundable retainer due upon signing — also serves as commencement of project. Failure to complete payment may result in cancellation of services. Client is allowed one complimentary edit/revision after delivery. Additional edits subject to $100 fee per revision. Overtime billed at $250/hr (weddings) or $200/hr (events), subject to availability.
          </div>

          {/* Signatures */}
          <div className="sig">
            <div>
              <div className="sig-line">Videographer Signature / Date</div>
            </div>
            <div>
              <div className="sig-line">Client Signature / Date</div>
            </div>
          </div>
        </div>

        <button className="print-btn" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <script dangerouslySetInnerHTML={{ __html: `
          document.querySelector('.print-btn').addEventListener('click', () => window.print());
        `}} />
      </body>
    </html>
  );
}
