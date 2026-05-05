-- Day 9g: snooze. Hide an inquiry from the active list until a future date,
-- then it pops back in. Idempotent.

alter table public.inquiries
  add column if not exists snoozed_until timestamptz;
