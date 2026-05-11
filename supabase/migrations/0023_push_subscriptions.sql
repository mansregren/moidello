-- Web Push subscriptions. Each row is one device/browser subscribed for
-- push to a given user. The endpoint is unique per browser-install — a
-- user can have many (phone PWA, desktop browser, work laptop, etc).

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "Users see own subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users insert own subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users delete own subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

create policy "Users update own subscriptions"
  on public.push_subscriptions for update
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.push_subscriptions
  to authenticated;
