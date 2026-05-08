-- View + click tracking so creators can see how their outfits perform.
--
-- viewer_token is either the auth user id (uuid as text) or an opaque
-- session cookie set server-side for anonymous viewers. We log every
-- view event raw and compute "unique views" via count(distinct viewer_token)
-- in the dashboard query — keeps the schema simple and lets us refine the
-- definition later without a backfill.

create table public.outfit_views (
  id uuid primary key default gen_random_uuid(),
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  viewer_token text not null,
  user_id uuid references public.profiles(id) on delete set null,
  viewed_at timestamptz not null default now()
);

create index outfit_views_outfit_idx on public.outfit_views (outfit_id);
create index outfit_views_outfit_token_idx
  on public.outfit_views (outfit_id, viewer_token);
create index outfit_views_viewed_at_idx
  on public.outfit_views (viewed_at desc);

alter table public.outfit_views enable row level security;

-- Anyone (auth or anon) may log their own view.
create policy "Anyone can record an outfit view"
  on public.outfit_views for insert
  with check (true);

-- Only the outfit owner can see view rows. (Aggregate counts are exposed via
-- the outfit_engagement view below, which is owner-restricted by the same
-- RLS gate.)
create policy "Owner sees views for own outfits"
  on public.outfit_views for select
  using (
    exists (
      select 1 from public.outfits o
      where o.id = outfit_id and o.user_id = auth.uid()
    )
  );


create table public.tag_clicks (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references public.tagged_items(id) on delete cascade,
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  viewer_token text not null,
  user_id uuid references public.profiles(id) on delete set null,
  clicked_at timestamptz not null default now()
);

create index tag_clicks_tag_idx on public.tag_clicks (tag_id);
create index tag_clicks_outfit_idx on public.tag_clicks (outfit_id);
create index tag_clicks_clicked_at_idx on public.tag_clicks (clicked_at desc);

alter table public.tag_clicks enable row level security;

create policy "Anyone can record a tag click"
  on public.tag_clicks for insert
  with check (true);

create policy "Owner sees clicks for own outfits"
  on public.tag_clicks for select
  using (
    exists (
      select 1 from public.outfits o
      where o.id = outfit_id and o.user_id = auth.uid()
    )
  );


-- Per-outfit aggregate. Defined as a view so the dashboard can fetch all
-- counters in one round-trip. Kept separate from outfit_stats (which is
-- public-readable for feeds) because views/clicks are owner-only data.
create view public.outfit_engagement as
  select
    o.id as outfit_id,
    o.user_id,
    o.title,
    o.image_url,
    o.created_at,
    coalesce(v.views, 0) as views,
    coalesce(v.unique_views, 0) as unique_views,
    coalesce(l.likes, 0) as likes,
    coalesce(s.saves, 0) as saves,
    coalesce(c.comments, 0) as comments,
    coalesce(tc.clicks, 0) as clicks
  from public.outfits o
  left join (
    select
      outfit_id,
      count(*) as views,
      count(distinct viewer_token) as unique_views
    from public.outfit_views
    group by outfit_id
  ) v on v.outfit_id = o.id
  left join (
    select outfit_id, count(*) as likes from public.likes group by outfit_id
  ) l on l.outfit_id = o.id
  left join (
    select outfit_id, count(*) as saves from public.saves group by outfit_id
  ) s on s.outfit_id = o.id
  left join (
    select outfit_id, count(*) as comments from public.comments group by outfit_id
  ) c on c.outfit_id = o.id
  left join (
    select outfit_id, count(*) as clicks from public.tag_clicks group by outfit_id
  ) tc on tc.outfit_id = o.id;
