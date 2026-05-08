-- Social: follows, likes, saves, comments.

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_followee_idx on public.follows (followee_id);

alter table public.follows enable row level security;

create policy "Follows are public"
  on public.follows for select
  using (true);

create policy "Users can follow on their own behalf"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow themselves"
  on public.follows for delete
  using (auth.uid() = follower_id);


create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, outfit_id)
);

create index likes_outfit_idx on public.likes (outfit_id);

alter table public.likes enable row level security;

create policy "Likes are public"
  on public.likes for select
  using (true);

create policy "Users like on their own behalf"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "Users unlike themselves"
  on public.likes for delete
  using (auth.uid() = user_id);


create table public.saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, outfit_id)
);

create index saves_outfit_idx on public.saves (outfit_id);

alter table public.saves enable row level security;

-- Saves are private to the saving user.
create policy "Users see own saves"
  on public.saves for select
  using (auth.uid() = user_id);

create policy "Users save on their own behalf"
  on public.saves for insert
  with check (auth.uid() = user_id);

create policy "Users remove own saves"
  on public.saves for delete
  using (auth.uid() = user_id);


create table public.comments (
  id uuid primary key default gen_random_uuid(),
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index comments_outfit_idx on public.comments (outfit_id, created_at desc);

alter table public.comments enable row level security;

create policy "Comments are public"
  on public.comments for select
  using (true);

create policy "Users comment on their own behalf"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users delete own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

create policy "Users edit own comments"
  on public.comments for update
  using (auth.uid() = user_id);


-- Aggregate views — saves a network round-trip when reading outfit lists.
create view public.outfit_stats as
  select
    o.id as outfit_id,
    coalesce(l.likes, 0) as likes,
    coalesce(s.saves, 0) as saves,
    coalesce(c.comments, 0) as comments
  from public.outfits o
  left join (select outfit_id, count(*) as likes from public.likes group by outfit_id) l on l.outfit_id = o.id
  left join (select outfit_id, count(*) as saves from public.saves group by outfit_id) s on s.outfit_id = o.id
  left join (select outfit_id, count(*) as comments from public.comments group by outfit_id) c on c.outfit_id = o.id;

create view public.profile_stats as
  select
    p.id as profile_id,
    coalesce(o.outfits, 0) as outfits,
    coalesce(f.followers, 0) as followers,
    coalesce(g.following, 0) as following
  from public.profiles p
  left join (select user_id, count(*) as outfits from public.outfits where is_published group by user_id) o on o.user_id = p.id
  left join (select followee_id, count(*) as followers from public.follows group by followee_id) f on f.followee_id = p.id
  left join (select follower_id, count(*) as following from public.follows group by follower_id) g on g.follower_id = p.id;
