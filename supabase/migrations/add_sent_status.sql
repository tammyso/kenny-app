-- Day 4: actually send the draft via Resend.
-- Adds a sent_at timestamp; draft_status gains a new "sent" value.
-- Idempotent — safe to re-run.

alter table public.inquiries
  add column if not exists sent_at timestamptz;
