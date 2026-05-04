-- Day 6a: Stripe invoicing for booked shoots. Persists the invoice id (so we
-- can fetch updated status later), the hosted invoice URL (for Kenny + the
-- client to view it), the amount we billed, and Stripe's current status
-- ("draft", "open", "paid", "uncollectible", "void"). Idempotent.

alter table public.inquiries
  add column if not exists stripe_invoice_id text,
  add column if not exists stripe_hosted_url text,
  add column if not exists invoice_amount_cents integer,
  add column if not exists invoice_status text;
