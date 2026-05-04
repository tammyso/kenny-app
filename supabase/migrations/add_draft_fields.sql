-- Day 3: AI reply drafts.
-- Run this in the Supabase SQL editor. It is idempotent — safe to re-run.

alter table public.inquiries
  add column if not exists draft_reply text,
  add column if not exists draft_status text,
  add column if not exists draft_generated_at timestamptz;

-- Authed users (Kenny) need UPDATE access to mutate drafts on the inquiries row.
drop policy if exists "authenticated users can update inquiries" on public.inquiries;

create policy "authenticated users can update inquiries"
  on public.inquiries
  for update
  to authenticated
  using (true)
  with check (true);

-- Policies don't grant table-level permission. This does.
grant update on public.inquiries to authenticated;
