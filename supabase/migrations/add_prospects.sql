-- Day 7a: outbound prospecting. Kenny manually adds brands he wants to pitch
-- for ongoing retainers; the app drafts cold outreach and tracks where each
-- conversation is. Idempotent — safe to re-run.

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  brand_name text not null,
  contact_name text,
  contact_email text not null,
  fit_notes text,
  draft_reply text,
  draft_status text,
  draft_generated_at timestamptz,
  sent_at timestamptz,
  status text
);

alter table public.prospects enable row level security;

drop policy if exists "authenticated users can read prospects" on public.prospects;
create policy "authenticated users can read prospects"
  on public.prospects for select
  to authenticated
  using (true);

drop policy if exists "authenticated users can write prospects" on public.prospects;
create policy "authenticated users can write prospects"
  on public.prospects for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.prospects to authenticated;
