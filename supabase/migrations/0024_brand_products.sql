-- Brand product catalog: a brand-account's master list of garments,
-- decoupled from any outfit. Creators tagging plagg can pick from
-- here so brand_name + buy_url + price stay consistent across
-- outfits, and brands can bulk-import their catalog via CSV.

create table public.brand_products (
  id uuid primary key default gen_random_uuid(),
  brand_profile_id uuid not null references public.profiles(id) on delete cascade,
  brand_key text not null,
  name text not null check (length(name) between 1 and 200),
  description text check (description is null or length(description) <= 2000),
  price numeric(10, 2),
  currency text default 'SEK' check (currency is null or length(currency) <= 8),
  buy_url text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index brand_products_brand_idx
  on public.brand_products (brand_profile_id, created_at desc);

create index brand_products_brand_key_idx
  on public.brand_products (brand_key);

create index brand_products_active_idx
  on public.brand_products (is_active, brand_key)
  where is_active = true;

create trigger brand_products_set_updated_at
  before update on public.brand_products
  for each row execute procedure public.set_updated_at();

alter table public.brand_products enable row level security;

-- Active catalog rows are public — they're the brand's marketing surface.
create policy "Active brand products are public"
  on public.brand_products for select
  using (is_active = true);

-- Owners (the brand profile) can see inactive rows too, for admin views.
create policy "Brand owner sees all own products"
  on public.brand_products for select
  using (auth.uid() = brand_profile_id);

create policy "Brand owner inserts products"
  on public.brand_products for insert
  with check (
    auth.uid() = brand_profile_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and account_type = 'brand'
    )
  );

create policy "Brand owner updates products"
  on public.brand_products for update
  using (auth.uid() = brand_profile_id);

create policy "Brand owner deletes products"
  on public.brand_products for delete
  using (auth.uid() = brand_profile_id);

grant select on public.brand_products to anon, authenticated;
grant insert, update, delete on public.brand_products to authenticated;
