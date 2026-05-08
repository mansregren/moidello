-- Notifications: a recipient (user_id) is told that an actor did something.
-- Inserted automatically by triggers on likes/follows/comments — clients
-- never write to this table directly. Recipients mark rows read.

create type public.notification_type as enum ('like', 'follow', 'comment');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  outfit_id uuid references public.outfits(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (user_id <> actor_id)
);

create index notifications_user_idx
  on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

create policy "Users see own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users mark own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id);

-- No insert policy: clients cannot write directly. Triggers below run as
-- security definer.

create policy "Users delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);


create function public.notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  outfit_owner uuid;
begin
  select user_id into outfit_owner from public.outfits where id = new.outfit_id;
  if outfit_owner is not null and outfit_owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, outfit_id)
    values (outfit_owner, new.user_id, 'like', new.outfit_id);
  end if;
  return new;
end;
$$;

create trigger on_like_inserted
  after insert on public.likes
  for each row execute procedure public.notify_on_like();


create function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.followee_id <> new.follower_id then
    insert into public.notifications (user_id, actor_id, type)
    values (new.followee_id, new.follower_id, 'follow');
  end if;
  return new;
end;
$$;

create trigger on_follow_inserted
  after insert on public.follows
  for each row execute procedure public.notify_on_follow();


create function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  outfit_owner uuid;
begin
  select user_id into outfit_owner from public.outfits where id = new.outfit_id;
  if outfit_owner is not null and outfit_owner <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, outfit_id, comment_id)
    values (outfit_owner, new.user_id, 'comment', new.outfit_id, new.id);
  end if;
  return new;
end;
$$;

create trigger on_comment_inserted
  after insert on public.comments
  for each row execute procedure public.notify_on_comment();
