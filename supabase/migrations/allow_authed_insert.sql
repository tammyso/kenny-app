-- Day 3.5: let authenticated users (Kenny himself) submit through /submit too.
-- The day-2 INSERT policy was scoped to anon only, so a logged-in user got
-- silently rejected. RLS uses OR semantics across policies, so adding a
-- second policy here keeps the existing anon path working.

drop policy if exists "authenticated users can insert inquiries" on public.inquiries;

create policy "authenticated users can insert inquiries"
  on public.inquiries
  for insert
  to authenticated
  with check (true);

grant insert on public.inquiries to authenticated;
