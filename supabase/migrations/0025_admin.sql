-- Admin panel: flag on profiles + RLS so admin reads cross-cut user data.
-- Keep it small: a single boolean. We don't need roles/permissions yet.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create index if not exists profiles_is_admin_idx
  on public.profiles (is_admin)
  where is_admin = true;

-- Seed: grant admin to the founding email if it has a profile.
-- Safe to run multiple times — pattern is idempotent.
update public.profiles
set is_admin = true
where id in (
  select id from auth.users where email = 'mansregren@gmail.com'
);

-- Admins can read every report so the queue actually shows up.
create policy "Admins see all reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Admins can update status on reports (dismiss / mark actioned).
create policy "Admins update reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

grant update on public.reports to authenticated;
