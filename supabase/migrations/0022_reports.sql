-- User reporting: lets viewers flag outfits, comments and profiles for review.
-- Required for UGC moderation; covers harassment, copyright, impersonation,
-- spam etc. Reports are private to the reporter and (eventually) to admin
-- tooling. Status field lets a future admin UI mark reports as triaged.

create type public.report_target as enum ('outfit', 'comment', 'profile');

create type public.report_reason as enum (
  'spam',
  'harassment',
  'inappropriate',
  'misinformation',
  'impersonation',
  'copyright',
  'other'
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason public.report_reason not null,
  body text check (body is null or length(body) <= 2000),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz not null default now()
);

create index reports_target_idx on public.reports (target_type, target_id);
create index reports_reporter_idx on public.reports (reporter_id, created_at desc);
create index reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

create policy "Users insert own reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "Users see own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

grant select, insert on public.reports to authenticated;
