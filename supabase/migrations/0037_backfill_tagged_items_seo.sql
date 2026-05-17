-- Best-effort SQL-backfill av description/keywords/alt_text/material
-- för tagged_items som ännu inte fått AI-backfill. Genererar datan från
-- befintliga fält (brand, name, garment, color + outfit.gender) så att
-- ingen produktsida visar tomma rubriker / saknar SEO-snippets innan
-- admin orkar köra Claude-backfillen i /admin/seo.
--
-- Helt idempotent: WHERE-villkoren skriver bara där fältet är NULL, så
-- AI-backfill som körs senare bara förbättrar — den ersätter inte och
-- migrationen kan köras om utan effekt.
--
-- Material derivteras från produktnamnet — om en känd material-token
-- finns i ${brand}+${name}-strängen sätts den, annars lämnas null kvar
-- för AI:n att försöka klassa senare.

-- ---------------- material ----------------
update public.tagged_items ti
set material = case
  when (ti.brand || ' ' || ti.name) ilike '%linne%' then 'Linne'
  when (ti.brand || ' ' || ti.name) ilike '%denim%' then 'Denim'
  when (ti.brand || ' ' || ti.name) ilike '%kashmir%' then 'Kashmir'
  when (ti.brand || ' ' || ti.name) ilike '%cashmere%' then 'Kashmir'
  when (ti.brand || ' ' || ti.name) ilike '%mohair%' then 'Mohair'
  when (ti.brand || ' ' || ti.name) ilike '%ull%' then 'Ull'
  when (ti.brand || ' ' || ti.name) ilike '%wool%' then 'Ull'
  when (ti.brand || ' ' || ti.name) ilike '%silke%' then 'Silke'
  when (ti.brand || ' ' || ti.name) ilike '%silk%' then 'Silke'
  when (ti.brand || ' ' || ti.name) ilike '%läder%' then 'Läder'
  when (ti.brand || ' ' || ti.name) ilike '%leather%' then 'Läder'
  when (ti.brand || ' ' || ti.name) ilike '%mocka%' then 'Mocka'
  when (ti.brand || ' ' || ti.name) ilike '%suede%' then 'Mocka'
  when (ti.brand || ' ' || ti.name) ilike '%bomull%' then 'Bomull'
  when (ti.brand || ' ' || ti.name) ilike '%cotton%' then 'Bomull'
  when (ti.brand || ' ' || ti.name) ilike '%viskos%' then 'Viskos'
  when (ti.brand || ' ' || ti.name) ilike '%fleece%' then 'Fleece'
  when (ti.brand || ' ' || ti.name) ilike '%satin%' then 'Satin'
  when (ti.brand || ' ' || ti.name) ilike '%kanvas%' then 'Kanvas'
  when (ti.brand || ' ' || ti.name) ilike '%canvas%' then 'Kanvas'
  else null
end
where ti.material is null;

-- ---------------- description ----------------
-- 280–500 tecken, sammanhängande svenska, refererar plagget i kontext.
update public.tagged_items ti
set description = (
  ti.brand || ' ' || ti.name || ' — '
  || coalesce(initcap(ti.color) || ' ', '')
  || lower(ti.garment)
  || coalesce(' i ' || lower(ti.material), '')
  || ' stylad i outfit på Moidello'
  || coalesce(' för ' || o.gender, '')
  || '. Se hur '
  || coalesce(initcap(ti.color) || ' ', '')
  || lower(ti.garment)
  || ' kombineras med resten av outfiten — märke, pris och köp-länk finns på sidan. Hitta fler outfit-idéer med liknande plagg via färg- och kategori-länkarna.'
)
from public.outfits o
where ti.outfit_id = o.id
  and ti.description is null;

-- ---------------- alt_text ----------------
update public.tagged_items ti
set alt_text = (
  coalesce(initcap(ti.color) || ' ', '')
  || lower(ti.garment)
  || ' från '
  || ti.brand
  || ' — '
  || ti.name
  || ', stylad i outfit på Moidello.'
)
where ti.alt_text is null;

-- ---------------- keywords ----------------
-- 6–8 strängar, lägre-case, varierande bredd. Filtrerar bort tomma efter
-- konstruktion + uppercappar till 10 element så DB-constraint:en respekteras.
update public.tagged_items ti
set keywords = (
  select array_agg(distinct kw)
  from (
    -- Plagg-typen själv som single token
    select lower(ti.garment) as kw
    union
    -- Plagg-typen för köntyp
    select lower(ti.garment) || ' ' || o.gender from public.outfits o where o.id = ti.outfit_id
    union
    -- Brand + plagg
    select lower(ti.brand) || ' ' || lower(ti.garment)
    union
    -- Brand + outfit
    select lower(ti.brand) || ' outfit'
    union
    -- Färg + plagg
    select lower(ti.color) || ' ' || lower(ti.garment) where ti.color is not null
    union
    -- Färg + outfit
    select lower(ti.color) || ' outfit' where ti.color is not null
    union
    -- Material + plagg
    select lower(ti.material) || ' ' || lower(ti.garment) where ti.material is not null
    union
    -- Generella
    select 'outfit-inspiration'
    union
    select 'outfit ' || o.gender from public.outfits o where o.id = ti.outfit_id
    union
    select lower(ti.garment) || '-outfit'
  ) generated
  where kw is not null and length(kw) > 0
  limit 10
)
where ti.keywords is null;
