-- SEO + scheduling fields on outfits to support the bild-först
-- seedningsflöde (admin uploads N images, Claude generates meta).
--
-- Status is derived rather than enum-stored so existing is_published
-- semantics stay intact:
--   draft     => is_published = false AND scheduled_for IS NULL
--   scheduled => is_published = false AND scheduled_for IS NOT NULL
--   published => is_published = true

alter table public.outfits
  add column if not exists meta_description text,
  add column if not exists keywords text[],
  add column if not exists alt_text text,
  add column if not exists scheduled_for timestamptz,
  add column if not exists created_by_admin boolean not null default false;

-- Char-cap on the SEO fields. meta_description targets the Google
-- snippet (~155). alt_text targets Google Images; longer is fine for
-- accessibility but a soft cap prevents abuse.
alter table public.outfits
  add constraint outfits_meta_description_len
    check (meta_description is null or char_length(meta_description) <= 200);

alter table public.outfits
  add constraint outfits_alt_text_len
    check (alt_text is null or char_length(alt_text) <= 400);

-- keywords: cap to 10 elements so we don't end up storing essays.
alter table public.outfits
  add constraint outfits_keywords_max
    check (keywords is null or array_length(keywords, 1) is null or array_length(keywords, 1) <= 10);

-- Index for "show me drafts ready to publish at time T" queries.
create index if not exists outfits_scheduled_for_idx
  on public.outfits (scheduled_for)
  where scheduled_for is not null;

-- Index for filtering admin-seeded posts in the user-facing feed if we
-- ever want to (e.g. demote them in ranking).
create index if not exists outfits_created_by_admin_idx
  on public.outfits (created_by_admin)
  where created_by_admin = true;
