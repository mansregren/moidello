-- Fix: "permission denied for table profiles" when upserting from the edit
-- sheet. PostgreSQL error code 42501 is a base GRANT failure, not RLS — so
-- this is about role privileges on the table/types, not policies.
--
-- We re-assert the privileges authenticated needs to upsert their own row,
-- and explicitly grant USAGE on the enum types we've added in later
-- migrations (account_type, notification_type) so columns of those types
-- can be set in INSERT/UPDATE.
--
-- We also re-state the UPDATE policy with an explicit WITH CHECK so the
-- upsert UPDATE path doesn't depend on Postgres' implicit fallback.

grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;

grant usage on type public.account_type to authenticated, anon;
grant usage on type public.notification_type to authenticated, anon;

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
