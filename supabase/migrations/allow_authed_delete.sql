-- The Delete button on the dashboard was silently no-op'ing because no DELETE
-- policy existed on inquiries. Adding one for authenticated users (Kenny);
-- anonymous public clients still have no delete access.

drop policy if exists "authenticated users can delete inquiries" on public.inquiries;
create policy "authenticated users can delete inquiries"
  on public.inquiries
  for delete
  to authenticated
  using (true);

grant delete on public.inquiries to authenticated;

-- Same fix for prospects, in case Kenny wants to clean up brands later.
drop policy if exists "authenticated users can delete prospects" on public.prospects;
create policy "authenticated users can delete prospects"
  on public.prospects
  for delete
  to authenticated
  using (true);

grant delete on public.prospects to authenticated;
