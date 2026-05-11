-- Admin impersonation: lets is_admin profiles write content on behalf of
-- any user. Required so "Posta som @creator" in /admin/anvandare can
-- create outfits/tags without spawning a service-role roundtrip.
--
-- We do NOT add cross-user policies for sensitive writes (reports update,
-- comments delete, follows) — impersonation is for *content creation*
-- only. Audit trail lives in the application layer (Header banner +
-- explicit cookie set by an admin-gated action).

create policy "Admins can create outfits as anyone"
  on public.outfits for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can update any outfit"
  on public.outfits for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can delete any outfit"
  on public.outfits for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can tag plagg in any outfit"
  on public.tagged_items for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can update any tagged item"
  on public.tagged_items for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can delete any tagged item"
  on public.tagged_items for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Admin manages profiles directly: flip is_admin, change names, delete.
create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "Admins can delete profiles"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Storage: admins can upload outfit images to any user's path so an
-- impersonated post lands under that user's namespace, not the admin's.
create policy "Admins upload anywhere in outfits bucket"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'outfits'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins delete anywhere in outfits bucket"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'outfits'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
