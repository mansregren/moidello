-- Andra innehållsvertikalen: "hem" (heminredning) vid sidan om "mode"
-- (kläder). Återanvänder hela outfits + tagged_items + engagemangs-stacken
-- (likes/saves/comments/views/tag_clicks hänger redan på outfit_id) — en
-- rads `vertical` är enda skillnaden. Mode-feeds scopar vertical='mode',
-- /home scopar vertical='hem'. Detalj-sidor är vertical-agnostiska.
--
-- Designval: en kolumn istället för en separat home_posts-tabell, just för
-- att slippa duplicera engagemang, stats-vyer, RLS, OG-bilder och hela
-- skapa-flödet. En "post" är en post oavsett om den visar en outfit ett rum.

-- 1. Diskriminatorn. Alla befintliga rader är kläder → default 'mode'.
alter table public.outfits
  add column if not exists vertical text not null default 'mode';

alter table public.outfits
  drop constraint if exists outfits_vertical_check;
alter table public.outfits
  add constraint outfits_vertical_check
    check (vertical in ('mode', 'hem'));

-- 2. gender är meningslöst för hem-poster. Släpp NOT NULL, men behåll det
--    obligatoriskt för mode så herr/dam-filtret aldrig ser en null.
alter table public.outfits
  alter column gender drop not null;

alter table public.outfits
  drop constraint if exists outfits_gender_required_for_mode;
alter table public.outfits
  add constraint outfits_gender_required_for_mode
    check (vertical <> 'mode' or gender is not null);

-- 3. Feed-index: båda vertikalerna paginerar publika rader på recency.
create index if not exists outfits_vertical_published_created_idx
  on public.outfits (vertical, is_published, created_at desc);
