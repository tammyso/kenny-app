-- Day 9e: lifecycle timestamps so the activity feed has accurate "when" data,
-- and so we can drive the review-request flow off "Delivered" state.
-- Idempotent.

alter table public.inquiries
  add column if not exists booked_at timestamptz,
  add column if not exists invoice_sent_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists review_requested_at timestamptz;
