-- Day 8b: workflow polish — archiving completed inquiries and internal notes
-- (visible to Kenny on the dashboard, never sent to clients). Idempotent.

alter table public.inquiries
  add column if not exists archived_at timestamptz,
  add column if not exists internal_notes text;
