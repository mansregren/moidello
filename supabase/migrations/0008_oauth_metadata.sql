-- Pull display_name + avatar from common OAuth provider fields when a new
-- auth.users row is created. Google ships 'name' / 'full_name' / 'picture',
-- Apple ships 'name', etc. The previous trigger only looked for
-- 'display_name' which OAuth providers don't set.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 10),
    coalesce(
      meta->>'display_name',
      meta->>'full_name',
      meta->>'name'
    ),
    coalesce(
      meta->>'avatar_url',
      meta->>'picture'
    )
  );
  return new;
end;
$$;
