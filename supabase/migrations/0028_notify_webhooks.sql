-- Wire up auto-delivery for push + email notifications.
--
-- The notify_on_* triggers in 0010 insert rows into public.notifications,
-- which powers the in-app bell. Push and email channels live behind two
-- API routes (/api/push/notify, /api/email/notify) that share a payload
-- shape and a secret header. This migration calls those routes via
-- pg_net.http_post from inside the existing triggers.
--
-- Settings (base_url + push_webhook_secret) live in a private table the
-- service operator fills in once after deploy. If they're missing, the
-- helper no-ops so triggers never block on misconfiguration.

create extension if not exists pg_net;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
revoke all on private.app_settings from public, anon, authenticated;

create or replace function private.get_setting(p_key text)
returns text
language sql
security definer
set search_path = private
as $$
  select value from private.app_settings where key = p_key
$$;
revoke all on function private.get_setting(text) from public, anon, authenticated;

-- Helper: post a JSON payload to one of our notify endpoints. Fail-soft —
-- a failed delivery must not roll back the DB write that triggered it.
create or replace function private.post_notify(p_path text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, private, net, extensions
as $$
declare
  base_url text;
  secret text;
begin
  base_url := private.get_setting('base_url');
  secret := private.get_setting('push_webhook_secret');
  if base_url is null or secret is null then
    return;
  end if;
  begin
    perform net.http_post(
      url := base_url || p_path,
      body := p_payload,
      headers := jsonb_build_object(
        'content-type', 'application/json',
        'x-push-secret', secret
      ),
      timeout_milliseconds := 5000
    );
  exception when others then
    -- Swallow — never block the originating write.
    null;
  end;
end;
$$;
revoke all on function private.post_notify(text, jsonb) from public, anon, authenticated;

-- Helper: fan out the same payload to both push + email endpoints.
create or replace function private.fanout_notify(p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  perform private.post_notify('/api/push/notify', p_payload);
  perform private.post_notify('/api/email/notify', p_payload);
end;
$$;
revoke all on function private.fanout_notify(jsonb) from public, anon, authenticated;


-- Replace existing trigger functions to also call the webhooks.

create or replace function public.notify_on_like()
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

    perform private.fanout_notify(jsonb_build_object(
      'user_id', outfit_owner,
      'kind', 'like',
      'actor_id', new.user_id,
      'outfit_id', new.outfit_id
    ));
  end if;
  return new;
end;
$$;

create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.followee_id <> new.follower_id then
    insert into public.notifications (user_id, actor_id, type)
    values (new.followee_id, new.follower_id, 'follow');

    perform private.fanout_notify(jsonb_build_object(
      'user_id', new.followee_id,
      'kind', 'follow',
      'actor_id', new.follower_id
    ));
  end if;
  return new;
end;
$$;

create or replace function public.notify_on_comment()
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

    perform private.fanout_notify(jsonb_build_object(
      'user_id', outfit_owner,
      'kind', 'comment',
      'actor_id', new.user_id,
      'outfit_id', new.outfit_id,
      'comment_id', new.id
    ));
  end if;
  return new;
end;
$$;


-- Messages don't write to notifications (DMs are surfaced via /meddelanden)
-- but we still want push + email when a new one arrives. Find the other
-- participant in the conversation and fan out.
create or replace function public.notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  other_user uuid;
begin
  select case
    when c.user_a = new.sender_id then c.user_b
    when c.user_b = new.sender_id then c.user_a
    else null
  end into other_user
  from public.conversations c
  where c.id = new.conversation_id;

  if other_user is not null and other_user <> new.sender_id then
    perform private.fanout_notify(jsonb_build_object(
      'user_id', other_user,
      'kind', 'message',
      'actor_id', new.sender_id
    ));
  end if;
  return new;
end;
$$;

drop trigger if exists on_message_notify on public.messages;
create trigger on_message_notify
  after insert on public.messages
  for each row execute procedure public.notify_on_message();
