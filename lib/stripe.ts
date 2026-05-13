import Stripe from "stripe";

let cached: Stripe | null = null;

function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  cached = new Stripe(key);
  return cached;
}

export type InvoiceCreationResult = {
  id: string;
  hostedUrl: string;
  status: string;
};

export async function sendInvoiceForShoot(args: {
  customerName: string;
  customerEmail: string;
  amountCents: number;
  description: string;
}): Promise<InvoiceCreationResult> {
  const stripe = getStripe();

  // Reuse an existing Stripe customer if one already exists for this email,
  // so a repeat client doesn't accumulate duplicate customer rows.
  const existing = await stripe.customers.list({
    email: args.customerEmail,
    limit: 1,
  });
  const customer =
    existing.data[0] ??
    (await stripe.customers.create({
      name: args.customerName,
      email: args.customerEmail,
    }));

  // Create the invoice first with pending_invoice_items_behavior=exclude so
  // unrelated pending items on this customer don't get bundled in. Then
  // attach our line item to this specific invoice id.
  const invoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: "send_invoice",
    days_until_due: 30,
    pending_invoice_items_behavior: "exclude",
  });
  if (!invoice.id) throw new Error("Stripe didn't return an invoice id");

  await stripe.invoiceItems.create({
    customer: customer.id,
    invoice: invoice.id,
    amount: args.amountCents,
    currency: "usd",
    description: args.description,
  });

  await stripe.invoices.finalizeInvoice(invoice.id);
  const sent = await stripe.invoices.sendInvoice(invoice.id);

  return {
    id: invoice.id,
    hostedUrl: sent.hosted_invoice_url ?? "",
    status: sent.status ?? "open",
  };
}

export async function fetchInvoiceStatus(invoiceId: string): Promise<string> {
  const stripe = getStripe();
  const invoice = await stripe.invoices.retrieve(invoiceId);
  return invoice.status ?? "open";
}

export async function createPaymentLink(args: {
  amountCents: number;
  description: string;
}): Promise<string> {
  const stripe = getStripe();
  const product = await stripe.products.create({ name: args.description });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: args.amountCents,
    currency: "usd",
  });
  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
  });
  return link.url;
}
