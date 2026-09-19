-- Display-only engagement boost for demo-seeded outfits.
--
-- Demo creators (profiles.is_demo = true, migration 0025) exist to make
-- the cold-start homepage look populated. Their outfits' like/save counts
-- are added on top of the real counts in outfit_stats/brand_dashboard —
-- never by inserting fake rows into `likes`/`saves`, which would require
-- fabricating phantom user accounts and would corrupt real relational
-- data (who liked what). Real outfits (is_demo = false owners) always
-- keep boost at 0, so their counts stay 100% real.

alter table public.outfits
  add column if not exists like_boost integer not null default 0 check (like_boost >= 0),
  add column if not exists save_boost integer not null default 0 check (save_boost >= 0);

create or replace view public.outfit_stats
with (security_invoker = on) as
  select
    o.id as outfit_id,
    coalesce(l.likes, 0) + o.like_boost as likes,
    (coalesce(sc.count, 0)::bigint + o.save_boost) as saves,
    coalesce(c.comments, 0) as comments
  from public.outfits o
  left join (
    select outfit_id, count(*) as likes
    from public.likes
    group by outfit_id
  ) l on l.outfit_id = o.id
  left join public.outfit_save_counts sc on sc.outfit_id = o.id
  left join (
    select outfit_id, count(*) as comments
    from public.comments
    group by outfit_id
  ) c on c.outfit_id = o.id;

grant select on public.outfit_stats to anon, authenticated;

-- Seed a random boost (40-150) on every current demo outfit. New demo
-- outfits created later won't automatically get a boost — re-run this
-- block (or set it by hand) if that's wanted.
update public.outfits o
set like_boost = 40 + floor(random() * 111)::int,
    save_boost = 40 + floor(random() * 111)::int
from public.profiles p
where p.id = o.user_id
  and p.is_demo = true;
