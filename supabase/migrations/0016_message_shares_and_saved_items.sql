-- Two related additions:
-- 1) messages can now carry a rich payload — outfit shares or item shares —
--    via content_type + content_data jsonb. Existing rows stay as 'text'.
-- 2) saved_items: per-tagged-item bookmarks. Like the saves table but for
--    individual garments inside an outfit instead of the whole outfit.

create type public.message_content_type as enum ('text', 'outfit_share', 'item_share');

alter table public.messages
  add column content_type public.message_content_type not null default 'text',
  add column content_data jsonb;

-- The body column is allowed to be empty for share messages (the rich
-- card carries the meaning). Loosen the length check so '' is accepted
-- when content_type != 'text'.
alter table public.messages
  drop constraint if exists messages_body_check;

alter table public.messages
  add constraint messages_body_check
  check (
    (content_type = 'text' and length(body) between 1 and 4000)
    or (content_type <> 'text' and length(body) between 0 and 4000)
  );


create table public.saved_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  tagged_item_id uuid not null references public.tagged_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tagged_item_id)
);

create index saved_items_user_idx on public.saved_items (user_id, created_at desc);

alter table public.saved_items enable row level security;

create policy "Users see own saved items"
  on public.saved_items for select
  using (auth.uid() = user_id);

create policy "Users save items on their own behalf"
  on public.saved_items for insert
  with check (auth.uid() = user_id);

create policy "Users remove own saved items"
  on public.saved_items for delete
  using (auth.uid() = user_id);

grant select, insert, delete on public.saved_items to authenticated;
