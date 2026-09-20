-- Backfill the display-only engagement boost (0041/0042) onto outfits
-- published since the last backfill — same idempotent shape (only rows
-- still at boost = 0), now covering both verticals since 'hem' outfits
-- were left out of 0042's vertical = 'mode' filter.
update public.outfits
set like_boost = 40 + floor(random() * 111)::int,
    save_boost = 40 + floor(random() * 111)::int
where is_published = true
  and like_boost = 0
  and save_boost = 0;
