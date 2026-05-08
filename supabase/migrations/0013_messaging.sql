-- Direct messaging: one canonical conversation per user pair, with a
-- chronological message log. Conversations enforce user_a < user_b so a
-- given pair only has one row regardless of who initiated.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

create index conversations_user_a_idx
  on public.conversations (user_a, last_message_at desc);
create index conversations_user_b_idx
  on public.conversations (user_b, last_message_at desc);

alter table public.conversations enable row level security;

create policy "Conversations: participants only"
  on public.conversations for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Conversations: participants insert"
  on public.conversations for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);

-- last_message_at gets bumped via trigger; participants need update for
-- the security-definer function below to satisfy RLS regardless.
create policy "Conversations: participants update"
  on public.conversations for update
  using (auth.uid() = user_a or auth.uid() = user_b);


create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_conv_idx
  on public.messages (conversation_id, created_at);
create index messages_unread_idx
  on public.messages (conversation_id, sender_id)
  where read_at is null;

alter table public.messages enable row level security;

create policy "Messages: participants read"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

create policy "Messages: sender inserts"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- Receiver can mark messages from the OTHER party as read.
create policy "Messages: recipient marks read"
  on public.messages for update
  using (
    auth.uid() <> sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );


-- Bump conversation.last_message_at on every new message. Definer so the
-- update sails through the conversations RLS regardless of the sender.
create function public.bump_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
    set last_message_at = new.created_at
    where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_inserted
  after insert on public.messages
  for each row execute procedure public.bump_conversation_last_message();
