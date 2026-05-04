-- Day 9a: AI triage + client research at inquiry time. Idempotent.

alter table public.inquiries
  add column if not exists triage_tag text,
  add column if not exists triage_reason text,
  add column if not exists client_research text;
