-- Backfill retailer + retailer_locale for existing cainte.com tagged_items
-- rows inserted before the cainte retailer module (lib/retailers/cainte.ts)
-- existed. Idempotent: only writes when retailer IS NULL.
-- Segment → locale mirrors LOCALE_TO_SEGMENT in lib/retailers/cainte.ts.
update public.tagged_items
set retailer = 'cainte',
    retailer_locale = case private.url_first_path_segment(buy_url)
      when 'en-se' then 'se'
      when 'de-de' then 'de'
      when 'en-at' then 'at'
      when 'en-ch' then 'ch'
      when 'fr-fr' then 'fr'
      when 'en-nl' then 'nl'
      when 'en-it' then 'it'
      when 'en-es' then 'es'
      when 'en-pl' then 'pl'
      when 'en-ie' then 'ie'
      when 'en-gb' then 'gb'
      when 'en-dk' then 'dk'
      when 'en-no' then 'no'
    end
where retailer is null
  and private.url_apex_host(buy_url) = 'cainte.com'
  and private.url_first_path_segment(buy_url) ~ '^[a-z]{2}-[a-z]{2}$';
