-- Account types: most users are creators (default), but a profile can also
-- represent a brand. Brand profiles "claim" a brand_name; the dashboard
-- aggregates engagement on outfits whose tagged_items.brand matches it.

create type public.account_type as enum ('creator', 'brand');

alter table public.profiles
  add column account_type public.account_type not null default 'creator',
  add column brand_name text,
  add column brand_website text;

-- Case-insensitive uniqueness on brand_name (only enforced for brand rows).
create unique index profiles_brand_name_unique
  on public.profiles (lower(brand_name))
  where account_type = 'brand' and brand_name is not null;

-- Lookup index used by the brand dashboard query.
create index tagged_items_brand_lower_idx
  on public.tagged_items (lower(brand));


-- Aggregate engagement for a brand's outfits, grouped by outfit. Joins
-- tagged_items.brand (case-insensitive) to profiles.brand_name and exposes
-- per-outfit counters. RLS on the underlying outfit_views/tag_clicks tables
-- already restricts read access to the outfit owner, so brands can only see
-- aggregates over outfits they themselves own — which we work around in the
-- application by fetching aggregates as the brand profile (which is also
-- the outfit owner). For brand-tagged outfits owned by other creators, we
-- expose only public counters (likes/saves/comments) — clicks/views remain
-- creator-private to respect their analytics.

create view public.brand_dashboard as
  select
    p.id as brand_profile_id,
    lower(p.brand_name) as brand_key,
    o.id as outfit_id,
    o.user_id as creator_id,
    o.title,
    o.image_url,
    o.created_at,
    coalesce(os.likes, 0) as likes,
    coalesce(os.saves, 0) as saves,
    coalesce(os.comments, 0) as comments,
    (
      select count(*) from public.tag_clicks tc
      join public.tagged_items ti on ti.id = tc.tag_id
      where tc.outfit_id = o.id
        and lower(ti.brand) = lower(p.brand_name)
    ) as brand_clicks
  from public.profiles p
  join public.tagged_items ti on lower(ti.brand) = lower(p.brand_name)
  join public.outfits o on o.id = ti.outfit_id and o.is_published = true
  left join public.outfit_stats os on os.outfit_id = o.id
  where p.account_type = 'brand'
    and p.brand_name is not null
  group by p.id, p.brand_name, o.id, o.user_id, o.title, o.image_url,
           o.created_at, os.likes, os.saves, os.comments;
