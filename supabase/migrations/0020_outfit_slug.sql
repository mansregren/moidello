-- Adds the URL-friendly slug column on outfits so we can move from
-- /outfit/<uuid> to /<username>/<slug> (e.g. /emmastyle/venice-cardigan).
-- The slug is unique per creator — two different users can both have
-- "summer-look" without colliding.

alter table public.outfits add column slug text;

create unique index outfits_user_slug_idx
  on public.outfits (user_id, slug)
  where slug is not null;

-- Backfill the 19 seed outfits. Slugs are derived manually here
-- (lowercase, ASCII-only, & → and-stripped, spaces → dashes) so we
-- don't need a Postgres slugify function for this one-off migration.
update public.outfits set slug = 'linen-navy'
  where id = '22222222-2222-2222-2222-000000000001';
update public.outfits set slug = 'stone-island-basics'
  where id = '22222222-2222-2222-2222-000000000002';
update public.outfits set slug = 'denim-suede'
  where id = '22222222-2222-2222-2222-000000000003';
update public.outfits set slug = 'chocolate-linen'
  where id = '22222222-2222-2222-2222-000000000004';
update public.outfits set slug = 'linen-suit-terrace'
  where id = '22222222-2222-2222-2222-000000000005';
update public.outfits set slug = 'mediterranean-summer'
  where id = '22222222-2222-2222-2222-000000000006';
update public.outfits set slug = 'knit-linen'
  where id = '22222222-2222-2222-2222-000000000007';
update public.outfits set slug = 'riviera-stripes'
  where id = '22222222-2222-2222-2222-000000000008';
update public.outfits set slug = 'resort-set'
  where id = '22222222-2222-2222-2222-000000000009';
update public.outfits set slug = 'venice-cardigan'
  where id = '22222222-2222-2222-2222-000000000010';
update public.outfits set slug = 'acme-studios-summer'
  where id = '22222222-2222-2222-2222-000000000011';
update public.outfits set slug = 'scarf-trousers'
  where id = '22222222-2222-2222-2222-000000000012';
update public.outfits set slug = 'scarf-leather-shorts'
  where id = '22222222-2222-2222-2222-000000000013';
update public.outfits set slug = 'leopard-denim'
  where id = '22222222-2222-2222-2222-000000000014';
update public.outfits set slug = 'suede-coffee'
  where id = '22222222-2222-2222-2222-000000000015';
update public.outfits set slug = 'olive-coffee'
  where id = '22222222-2222-2222-2222-000000000016';
update public.outfits set slug = 'beige-bomber-street'
  where id = '22222222-2222-2222-2222-000000000017';
update public.outfits set slug = 'paris-stripes'
  where id = '22222222-2222-2222-2222-000000000018';
update public.outfits set slug = 'cafe-blouse'
  where id = '22222222-2222-2222-2222-000000000019';
