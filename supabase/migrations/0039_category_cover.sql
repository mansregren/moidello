-- Per-category cover selection. Admins flag one outfit per (vertical,
-- category) as the cover shown on the /home room cards and /stil/fashion
-- category cards, overriding the "newest post" default.
alter table public.outfits
  add column if not exists is_category_cover boolean not null default false;

-- Fast lookup of the flagged cover per category.
create index if not exists outfits_category_cover_idx
  on public.outfits (vertical, category)
  where is_category_cover = true;
