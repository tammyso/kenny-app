-- Day 9f: pre-shoot questionnaire (client fills out logistics after booking)
-- and a deliverable URL for the post-shoot delivery loop. Idempotent.

alter table public.inquiries
  add column if not exists pre_shoot_responses jsonb,
  add column if not exists pre_shoot_completed_at timestamptz,
  add column if not exists deliverable_url text;
