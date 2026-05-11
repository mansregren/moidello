-- Admin v2: mark demo accounts so they can be filtered out, and let admins
-- upload to avatar storage for any user (so we can change an impersonated
-- user's profile picture from /admin/anvandare).

alter table public.profiles
  add column if not exists is_demo boolean not null default false;

create index if not exists profiles_is_demo_idx
  on public.profiles (is_demo)
  where is_demo = true;

-- Backfill: anyone with an @demo.moidello.com email is a demo user. This
-- catches the seeded creators from 0014 and anything created through
-- /admin's seed/createDummyCreator path.
update public.profiles p
set is_demo = true
where exists (
  select 1 from auth.users u
  where u.id = p.id
    and u.email like '%@demo.moidello.com'
);

create policy "Admins upload anywhere in avatars bucket"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins delete anywhere in avatars bucket"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins update anywhere in avatars bucket"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
