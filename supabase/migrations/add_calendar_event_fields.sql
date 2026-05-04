-- Day 5c: booking a shoot creates a Google Calendar event. Store the event id
-- so we can update/cancel it later, and the html link so the dashboard can
-- link out to it. Idempotent — safe to re-run.

alter table public.inquiries
  add column if not exists calendar_event_id text,
  add column if not exists calendar_event_link text;
