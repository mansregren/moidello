-- Rich product metadata on tagged_items: auto-fetched from retailer
-- product pages via the new preview-from-url endpoint. Plus geo-aware
-- click tracking on tag_clicks.

alter table public.tagged_items
  add column if not exists color text,
  add column if not exists retailer text,
  add column if not exists retailer_locale text,
  add column if not exists image_url text,
  add column if not exists cached_metadata jsonb,
  add column if not exists last_fetched_at timestamptz,
  add column if not exists is_active boolean not null default true,
  add column if not exists affiliate_network text;

-- Short text caps on the SEO/retailer fields.
alter table public.tagged_items
  add constraint tagged_items_color_len
    check (color is null or char_length(color) <= 40);

alter table public.tagged_items
  add constraint tagged_items_retailer_len
    check (retailer is null or char_length(retailer) <= 64);

alter table public.tagged_items
  add constraint tagged_items_retailer_locale_len
    check (retailer_locale is null or char_length(retailer_locale) <= 8);

alter table public.tagged_items
  add constraint tagged_items_affiliate_network_len
    check (affiliate_network is null or char_length(affiliate_network) <= 32);

-- Index for "show only retailer X" queries from brand-dashboard later.
create index if not exists tagged_items_retailer_idx
  on public.tagged_items (retailer)
  where retailer is not null;

-- Index for dead-link cron later (find items not fetched in 30 days).
create index if not exists tagged_items_last_fetched_idx
  on public.tagged_items (last_fetched_at)
  where last_fetched_at is not null;

-- Geo column on click-tracking so brand dashboards can show
-- "where do my buyers come from" later.
alter table public.tag_clicks
  add column if not exists visitor_country text,
  add column if not exists referrer text,
  add column if not exists user_agent text;

alter table public.tag_clicks
  add constraint tag_clicks_visitor_country_len
    check (visitor_country is null or char_length(visitor_country) <= 8);
