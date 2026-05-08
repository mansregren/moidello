-- Boards: named, optionally-public collections of outfits a user has curated.
-- Distinct from `saves` (which is a flat private bookmark list).

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  description text check (length(description) <= 500),
  is_public boolean not null default true,
  cover_outfit_id uuid references public.outfits(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index boards_user_id_idx on public.boards (user_id);
create index boards_public_idx on public.boards (is_public, created_at desc);

create trigger boards_set_updated_at
  before update on public.boards
  for each row execute procedure public.set_updated_at();

alter table public.boards enable row level security;

create policy "Boards: visible if public, otherwise owner-only"
  on public.boards for select
  using (is_public = true or auth.uid() = user_id);

create policy "Boards: owner inserts"
  on public.boards for insert
  with check (auth.uid() = user_id);

create policy "Boards: owner updates"
  on public.boards for update
  using (auth.uid() = user_id);

create policy "Boards: owner deletes"
  on public.boards for delete
  using (auth.uid() = user_id);


create table public.board_outfits (
  board_id uuid not null references public.boards(id) on delete cascade,
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (board_id, outfit_id)
);

create index board_outfits_board_idx on public.board_outfits (board_id);
create index board_outfits_outfit_idx on public.board_outfits (outfit_id);

alter table public.board_outfits enable row level security;

create policy "Board outfits inherit board visibility"
  on public.board_outfits for select
  using (
    exists (
      select 1 from public.boards b
      where b.id = board_id
        and (b.is_public = true or b.user_id = auth.uid())
    )
  );

create policy "Board outfits: owner of board inserts"
  on public.board_outfits for insert
  with check (
    exists (
      select 1 from public.boards b
      where b.id = board_id and b.user_id = auth.uid()
    )
  );

create policy "Board outfits: owner of board deletes"
  on public.board_outfits for delete
  using (
    exists (
      select 1 from public.boards b
      where b.id = board_id and b.user_id = auth.uid()
    )
  );


-- Aggregate that lists boards with their outfit counts (saves a round-trip
-- on the boards listing page).
create view public.board_summary as
  select
    b.id,
    b.user_id,
    b.name,
    b.description,
    b.is_public,
    b.cover_outfit_id,
    b.created_at,
    b.updated_at,
    coalesce(bc.count, 0) as outfit_count
  from public.boards b
  left join (
    select board_id, count(*) as count
    from public.board_outfits
    group by board_id
  ) bc on bc.board_id = b.id;
