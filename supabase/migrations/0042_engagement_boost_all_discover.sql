-- Extend the display-only engagement boost (0041) from demo outfits to
-- every outfit shown on /upptack (is_published = true, vertical = 'mode').
-- Only touches rows that haven't been boosted yet (like_boost = 0 and
-- save_boost = 0), so it's safe to re-run and won't re-randomize the
-- demo outfits 0041 already seeded.
update public.outfits
set like_boost = 40 + floor(random() * 111)::int,
    save_boost = 40 + floor(random() * 111)::int
where is_published = true
  and vertical = 'mode'
  and like_boost = 0
  and save_boost = 0;
