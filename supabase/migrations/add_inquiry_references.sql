-- Day 9d: clients can attach reference images to their inquiry — mood boards,
-- aesthetic references, etc. Storage lives in a public Supabase Storage
-- bucket; the inquiry record holds the resulting URLs in JSONB.
--
-- Idempotent — safe to re-run.

alter table public.inquiries
  add column if not exists client_references jsonb;

-- Storage bucket (public so anonymous viewers — both kenny on the dashboard
-- and the AI fetching urls — can read without auth).
insert into storage.buckets (id, name, public)
values ('inquiry-references', 'inquiry-references', true)
on conflict (id) do nothing;

-- Anonymous clients submitting the form upload directly to this bucket.
drop policy if exists "anon upload inquiry references" on storage.objects;
create policy "anon upload inquiry references"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'inquiry-references');

drop policy if exists "public read inquiry references" on storage.objects;
create policy "public read inquiry references"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'inquiry-references');
