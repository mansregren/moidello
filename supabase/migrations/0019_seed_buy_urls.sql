-- Backfill buy_url for the demo seed items so the Köp-button actually
-- goes somewhere instead of href="#". Until per-item affiliate links
-- exist, point at the brand's homepage as a sensible default.
--
-- Future affiliate-wrapper goal:
--   /go/[item_id] → 302 to the per-region affiliate URL with click
--   logging baked in. The TaggedItemCard "Köp" link will then read
--   /go/<item.id>?ref=<region> instead of buy_url directly. See
--   components/outfit/TaggedItem.tsx + ProduktPage for placeholders.

update public.tagged_items set buy_url = 'https://www.morrisstockholm.com'
  where lower(brand) = 'morris' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.arket.com'
  where lower(brand) = 'arket' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.paraboot.com'
  where lower(brand) = 'paraboot' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.stoneisland.com'
  where lower(brand) = 'stone island' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.levi.com'
  where lower(brand) = 'levi''s' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.danner.com'
  where lower(brand) = 'danner' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.drakes.com'
  where lower(brand) = 'drake''s' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.incotex.com'
  where lower(brand) = 'incotex' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.carminashoemaker.com'
  where lower(brand) = 'carmina' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.andersons.it'
  where lower(brand) = 'anderson''s' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://depetrillo.com'
  where lower(brand) = 'de petrillo' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.sunspel.com'
  where lower(brand) = 'sunspel' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.edwardgreen.com'
  where lower(brand) = 'edward green' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.oscarjacobson.com'
  where lower(brand) = 'oscar jacobson' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.crockettandjones.com'
  where lower(brand) = 'crockett & jones' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.stenstroms.com'
  where lower(brand) = 'stenströms' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.gransasso.it'
  where lower(brand) = 'gran sasso' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.loake.co.uk'
  where lower(brand) = 'loake' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.garrettleight.com'
  where lower(brand) = 'garrett leight' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://oas.company'
  where lower(brand) = 'oas' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.mismo.dk'
  where lower(brand) = 'mismo' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://toteme-studio.com'
  where lower(brand) = 'totême' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.dior.com'
  where lower(brand) = 'dior' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.therow.com'
  where lower(brand) = 'the row' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.celine.com'
  where lower(brand) = 'celine' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.acnestudios.com'
  where lower(brand) in ('acne studios', 'acme studios') and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.ganni.com'
  where lower(brand) = 'ganni' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.chanel.com'
  where lower(brand) = 'chanel' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.maxmara.com'
  where lower(brand) = 'max mara' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.hermes.com'
  where lower(brand) = 'hermès' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://thefrankieshop.com'
  where lower(brand) = 'the frankie shop' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.sandro-paris.com'
  where lower(brand) = 'sandro' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.hanes.com'
  where lower(brand) = 'hanes' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.agolde.com'
  where lower(brand) = 'agolde' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.sezane.com'
  where lower(brand) = 'sézane' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.mulberry.com'
  where lower(brand) = 'mulberry' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.standstudio.com'
  where lower(brand) = 'stand studio' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.citizensofhumanity.com'
  where lower(brand) = 'citizens of humanity' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.bottegaveneta.com'
  where lower(brand) = 'bottega veneta' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.samsoe.com'
  where lower(brand) = 'samsøe samsøe' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.filippa-k.com'
  where lower(brand) = 'filippa k' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.adidas.com'
  where lower(brand) = 'adidas' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.polene-paris.com'
  where lower(brand) = 'polène' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.stories.com'
  where lower(brand) = '& other stories' and (buy_url is null or buy_url = '#');

update public.tagged_items set buy_url = 'https://www.johnstonsofelgin.com'
  where lower(brand) = 'johnstons of elgin' and (buy_url is null or buy_url = '#');
