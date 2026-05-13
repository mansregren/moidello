-- Backfill retailer + retailer_locale on existing tagged_items rows that
-- were inserted before retailer detection was wired into the paste-form,
-- or via the bulk-image flow where tags are added later by hand without
-- triggering the preview-from-url endpoint.
--
-- The match logic mirrors lib/retailers/*.ts:
--   - Same domain-set per retailer id.
--   - Same locale-segment regex for retailers where we know the URL shape.
-- Idempotent: only writes when retailer IS NULL, so re-running has no
-- effect on rows already filled in by refetchFromUrl.
--
-- IMPORTANT: this migration only sets `retailer` (and locale where it can
-- be derived from the URL alone). It does NOT fetch the page to extract
-- brand/price/image — that requires an admin re-paste of the URL, which
-- now correctly populates everything.

-- 1. Helper: extract apex host from a URL (strips "www." / "www2.")
create or replace function private.url_apex_host(u text)
returns text
language sql
immutable
parallel safe
as $$
  select lower(regexp_replace(
    regexp_replace(coalesce(substring(u from '://([^/]+)'), ''), '^www2?\.', ''),
    ':\d+$',
    ''
  ));
$$;

-- 2. Helper: extract the leading path segment after the host
create or replace function private.url_first_path_segment(u text)
returns text
language sql
immutable
parallel safe
as $$
  select lower(coalesce(
    (regexp_match(coalesce(substring(u from '://[^/]+(/.*)'), '/'), '^/([^/?#]+)'))[1],
    ''
  ));
$$;

-- 3. Domain → retailer-id mapping. Single update; LEFT JOINs the host
-- against a values list. Only updates rows where retailer is null.
with mapping(host, retailer_id) as (
  values
    ('johnhenric.com',  'johnhenric'),
    ('zalando.se',      'zalando'),
    ('zalando.no',      'zalando'),
    ('zalando.dk',      'zalando'),
    ('zalando.fi',      'zalando'),
    ('zalando.de',      'zalando'),
    ('zalando.nl',      'zalando'),
    ('zalando.be',      'zalando'),
    ('zalando.fr',      'zalando'),
    ('zalando.pl',      'zalando'),
    ('zalando.it',      'zalando'),
    ('zalando.es',      'zalando'),
    ('zalando.at',      'zalando'),
    ('zalando.ch',      'zalando'),
    ('zalando.co.uk',   'zalando'),
    ('zalando.ie',      'zalando'),
    ('zalando.cz',      'zalando'),
    ('zalando.sk',      'zalando'),
    ('stories.com',     'stories'),
    ('hm.com',          'hm'),
    ('cos.com',         'cos'),
    ('arket.com',       'arket'),
    ('na-kd.com',       'nakd'),
    ('nelly.com',       'nelly'),
    ('filippa-k.com',   'filippak'),
    ('acnestudios.com', 'acnestudios'),
    ('toteme.com',      'toteme'),
    ('toteme-studio.com','toteme'),
    ('ganni.com',       'ganni'),
    ('sezane.com',      'sezane'),
    ('mango.com',       'mango'),
    ('shop.mango.com',  'mango')
)
update public.tagged_items t
set retailer = m.retailer_id
from mapping m
where t.retailer is null
  and t.buy_url is not null
  and private.url_apex_host(t.buy_url) = m.host;

-- 4. Locale-segment detection per retailer. Best-effort — we only fill it
-- when the URL pattern matches; otherwise leave NULL and let the runtime
-- /go redirect fall back to passing the URL through unchanged.

-- 4a. Zalando: TLD-based locale (already in apex host)
update public.tagged_items
set retailer_locale = case private.url_apex_host(buy_url)
  when 'zalando.se' then 'se'
  when 'zalando.no' then 'no'
  when 'zalando.dk' then 'dk'
  when 'zalando.fi' then 'fi'
  when 'zalando.de' then 'de'
  when 'zalando.nl' then 'nl'
  when 'zalando.be' then 'be'
  when 'zalando.fr' then 'fr'
  when 'zalando.pl' then 'pl'
  when 'zalando.it' then 'it'
  when 'zalando.es' then 'es'
  when 'zalando.at' then 'at'
  when 'zalando.ch' then 'ch'
  when 'zalando.co.uk' then 'gb'
  when 'zalando.ie' then 'ie'
  when 'zalando.cz' then 'cz'
  when 'zalando.sk' then 'sk'
end
where retailer = 'zalando' and retailer_locale is null;

-- 4b. John Henric: /<locale>/... with se/no/dk/fi/de/fr/es/nl/int
update public.tagged_items
set retailer_locale = private.url_first_path_segment(buy_url)
where retailer = 'johnhenric'
  and retailer_locale is null
  and private.url_first_path_segment(buy_url) in
      ('se','no','dk','fi','de','fr','es','nl','int');

-- 4c. & Other Stories: /en_<currency>/...
update public.tagged_items
set retailer_locale = case private.url_first_path_segment(buy_url)
  when 'en_sek' then 'se'
  when 'en_nok' then 'no'
  when 'en_dkk' then 'dk'
  when 'en_eur' then 'de'  -- pick a representative; multi-country EUR
  when 'en_chf' then 'ch'
  when 'en_gbp' then 'gb'
  when 'en_usd' then 'us'
end
where retailer = 'stories'
  and retailer_locale is null
  and private.url_first_path_segment(buy_url) ~ '^en_[a-z]{3}$';

-- 4d. H&M: /<lang>_<country>/...
update public.tagged_items
set retailer_locale = case private.url_first_path_segment(buy_url)
  when 'sv_se' then 'se'
  when 'no_no' then 'no'
  when 'da_dk' then 'dk'
  when 'fi_fi' then 'fi'
  when 'de_de' then 'de'
  when 'fr_fr' then 'fr'
  when 'nl_nl' then 'nl'
  when 'fr_be' then 'be'
  when 'it_it' then 'it'
  when 'es_es' then 'es'
  when 'de_at' then 'at'
  when 'de_ch' then 'ch'
  when 'en_gb' then 'gb'
  when 'en_ie' then 'ie'
  when 'pl_pl' then 'pl'
  when 'cs_cz' then 'cz'
  when 'en_us' then 'us'
end
where retailer = 'hm'
  and retailer_locale is null
  and private.url_first_path_segment(buy_url) ~ '^[a-z]{2}_[a-z]{2}$';

-- 4e. COS / ARKET: /en_<currency>/... (same group as &OS)
update public.tagged_items
set retailer_locale = case private.url_first_path_segment(buy_url)
  when 'en_sek' then 'se'
  when 'en_nok' then 'no'
  when 'en_dkk' then 'dk'
  when 'en_eur' then 'de'
  when 'en_chf' then 'ch'
  when 'en_gbp' then 'gb'
  when 'en_usd' then 'us'
end
where retailer in ('cos', 'arket')
  and retailer_locale is null
  and private.url_first_path_segment(buy_url) ~ '^en_[a-z]{3}$';

-- 4f. NA-KD: /<2letter>/ or /<lang>-<country>/
update public.tagged_items
set retailer_locale = case
  when private.url_first_path_segment(buy_url) = 'sv'    then 'se'
  when private.url_first_path_segment(buy_url) = 'no'    then 'no'
  when private.url_first_path_segment(buy_url) = 'dk'    then 'dk'
  when private.url_first_path_segment(buy_url) = 'fi'    then 'fi'
  when private.url_first_path_segment(buy_url) = 'de'    then 'de'
  when private.url_first_path_segment(buy_url) = 'fr'    then 'fr'
  when private.url_first_path_segment(buy_url) = 'nl'    then 'nl'
  when private.url_first_path_segment(buy_url) = 'it'    then 'it'
  when private.url_first_path_segment(buy_url) = 'es'    then 'es'
  when private.url_first_path_segment(buy_url) = 'pl'    then 'pl'
  when private.url_first_path_segment(buy_url) = 'en-gb' then 'gb'
  when private.url_first_path_segment(buy_url) = 'en'    then 'us'
end
where retailer = 'nakd'
  and retailer_locale is null;

-- 4g. Nelly: /<country>/...
update public.tagged_items
set retailer_locale = private.url_first_path_segment(buy_url)
where retailer = 'nelly'
  and retailer_locale is null
  and private.url_first_path_segment(buy_url) in ('se','no','dk','fi');

-- 4h. Filippa K: /<lang>-<country>/...
update public.tagged_items
set retailer_locale = case private.url_first_path_segment(buy_url)
  when 'sv-se' then 'se'
  when 'en-no' then 'no'
  when 'en-dk' then 'dk'
  when 'en-fi' then 'fi'
  when 'de-de' then 'de'
  when 'en-fr' then 'fr'
  when 'en-nl' then 'nl'
  when 'en-be' then 'be'
  when 'en-it' then 'it'
  when 'en-es' then 'es'
  when 'de-at' then 'at'
  when 'de-ch' then 'ch'
  when 'en-gb' then 'gb'
  when 'en-ie' then 'ie'
  when 'en-us' then 'us'
end
where retailer = 'filippak'
  and retailer_locale is null
  and private.url_first_path_segment(buy_url) ~ '^[a-z]{2}-[a-z]{2}$';

-- 5. Cleanup: helper functions stay in private. schema for potential
-- future re-runs / debugging. No-op drop omitted.
