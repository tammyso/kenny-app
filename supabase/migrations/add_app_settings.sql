-- Day 5a: a tiny key-value store for app-wide settings.
-- Used now to persist Kenny's Google Calendar refresh token. Could hold other
-- settings later (default reply tone, notification email, etc.) without needing
-- a fresh table each time.

create table if not exists public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "authenticated users can read app_settings" on public.app_settings;
create policy "authenticated users can read app_settings"
  on public.app_settings
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated users can write app_settings" on public.app_settings;
create policy "authenticated users can write app_settings"
  on public.app_settings
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.app_settings to authenticated;
