-- SEO-fält på tagged_items. Speglar 0030 för outfits — varje plagg får
-- description, keywords[], alt_text och material så /produkt/[id] kan
-- ranka på long-tail-sök ("beige trenchcoat herr outfit", "stickad
-- mohair cardigan beige" osv) istället för att vara thin content.
--
-- description blir både synlig text på produkt-sidan och Google-snippet.
-- keywords[] driver internal linking (taggar som leder till färg-/typ-
-- sidor) — inte direkt SEO-vikt, men strukturerad signal.
-- material är nytt; behövs inte alltid men ger stor signal när det finns
-- (linne, ull, denim — folk söker "vit linneskjorta" inte "vit skjorta").
-- alt_text dyker upp i produktsidans <img alt> + i OG-bilden.

alter table public.tagged_items
  add column if not exists description text,
  add column if not exists keywords text[],
  add column if not exists alt_text text,
  add column if not exists material text;

alter table public.tagged_items
  add constraint tagged_items_description_len
    check (description is null or char_length(description) <= 600);

alter table public.tagged_items
  add constraint tagged_items_alt_text_len
    check (alt_text is null or char_length(alt_text) <= 400);

alter table public.tagged_items
  add constraint tagged_items_material_len
    check (material is null or char_length(material) <= 60);

-- Mirror outfits-cap: max 10 keywords. NULL = inte ifyllt än.
alter table public.tagged_items
  add constraint tagged_items_keywords_max
    check (keywords is null or array_length(keywords, 1) is null or array_length(keywords, 1) <= 10);

-- GIN på keywords för "alla plagg med keyword X"-uppslag när färg-/typ-
-- landningssidorna byggs.
create index if not exists tagged_items_keywords_idx
  on public.tagged_items using gin (keywords);

-- B-tree på material för enkla equality-filter på /material/<slug>.
create index if not exists tagged_items_material_idx
  on public.tagged_items (material)
  where material is not null;
