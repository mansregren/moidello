-- Plaggbank: an admin-curated catalog of garments, decoupled from any
-- outfit. Admins paste product URLs (or upload manually) into
-- /admin/plagg, then click outfits together in /admin/snabb-outfit — the
-- builder renders a flatlay image and writes ordinary tagged_items rows,
-- linked back here via tagged_items.catalog_item_id.
--
-- Images are always a copy in our own storage (outfits bucket, catalog/
-- prefix) so the builder's canvas can draw them (CORS) and they never rot
-- when a retailer CDN changes. source_image_url keeps the original.

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (char_length(brand) between 1 and 120),
  name text not null check (char_length(name) between 1 and 200),
  garment text not null check (char_length(garment) between 1 and 40),
  -- null = unisex / fits both
  gender public.outfit_gender,
  color text check (color is null or char_length(color) <= 40),
  material text check (material is null or char_length(material) <= 60),
  price numeric(10, 2) check (price is null or price >= 0),
  currency text not null default 'SEK' check (char_length(currency) <= 8),
  buy_url text check (buy_url is null or char_length(buy_url) <= 2000),
  -- buy_url without query/fragment, lower-cased host — used for dedupe.
  url_key text check (url_key is null or char_length(url_key) <= 2000),
  image_url text not null check (char_length(image_url) <= 1000),
  image_path text,
  -- Studio background of the stored photo: "transparent", "#rrggbb", or
  -- null for a busy photo. The builder paints the garment's box in it.
  image_bg text check (image_bg is null or char_length(image_bg) <= 16),
  source_image_url text check (source_image_url is null or char_length(source_image_url) <= 2000),
  retailer text check (retailer is null or char_length(retailer) <= 64),
  retailer_locale text check (retailer_locale is null or char_length(retailer_locale) <= 8),
  is_affiliate boolean not null default false,
  affiliate_network text check (affiliate_network is null or char_length(affiliate_network) <= 32),
  is_archived boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index catalog_items_url_key_uniq
  on public.catalog_items (url_key)
  where url_key is not null;

create index catalog_items_active_idx
  on public.catalog_items (garment, created_at desc)
  where is_archived = false;

create trigger catalog_items_set_updated_at
  before update on public.catalog_items
  for each row execute procedure public.set_updated_at();

alter table public.catalog_items enable row level security;

-- Admin-only in every direction. The catalog is a tool, not a public
-- surface — the public sees garments through tagged_items as before.
create policy "Admins manage catalog items"
  on public.catalog_items for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

grant select, insert, update, delete on public.catalog_items to authenticated;
grant all on public.catalog_items to service_role;

-- Link outfit tags back to the catalog item they came from, so the
-- catalog can show "used in N outfits" and future edits can propagate.
alter table public.tagged_items
  add column if not exists catalog_item_id uuid
    references public.catalog_items(id) on delete set null;

create index if not exists tagged_items_catalog_item_idx
  on public.tagged_items (catalog_item_id)
  where catalog_item_id is not null;
