-- Outfits + tagged garments + storage bucket for outfit images.

create type public.outfit_type as enum ('photo', 'flatlay');
create type public.outfit_gender as enum ('herr', 'dam');

create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  image_path text not null, -- storage path, used to delete blob on row delete
  type public.outfit_type not null default 'photo',
  gender public.outfit_gender not null,
  title text not null,
  description text,
  category text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index outfits_user_id_idx on public.outfits (user_id);
create index outfits_created_at_idx on public.outfits (created_at desc);
create index outfits_gender_idx on public.outfits (gender);

create trigger outfits_set_updated_at
  before update on public.outfits
  for each row execute procedure public.set_updated_at();

alter table public.outfits enable row level security;

create policy "Published outfits are viewable by everyone"
  on public.outfits for select
  using (is_published = true or auth.uid() = user_id);

create policy "Users can insert own outfits"
  on public.outfits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own outfits"
  on public.outfits for update
  using (auth.uid() = user_id);

create policy "Users can delete own outfits"
  on public.outfits for delete
  using (auth.uid() = user_id);


create table public.tagged_items (
  id uuid primary key default gen_random_uuid(),
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  brand text not null,
  name text not null,
  price numeric(10, 2),
  currency text default 'SEK',
  buy_url text,
  garment text not null, -- "Toppar", "Byxor" etc — kept as text to match existing types
  position_x numeric(5, 2) not null check (position_x >= 0 and position_x <= 100),
  position_y numeric(5, 2) not null check (position_y >= 0 and position_y <= 100),
  is_affiliate boolean not null default false,
  created_at timestamptz not null default now()
);

create index tagged_items_outfit_id_idx on public.tagged_items (outfit_id);

alter table public.tagged_items enable row level security;

-- Tagged items inherit visibility from their outfit. Read is open to anyone
-- whose outfit row is visible; write is gated on outfit ownership.
create policy "Tagged items follow outfit visibility"
  on public.tagged_items for select
  using (
    exists (
      select 1 from public.outfits o
      where o.id = outfit_id
        and (o.is_published = true or o.user_id = auth.uid())
    )
  );

create policy "Owner can insert tagged items"
  on public.tagged_items for insert
  with check (
    exists (
      select 1 from public.outfits o
      where o.id = outfit_id and o.user_id = auth.uid()
    )
  );

create policy "Owner can update tagged items"
  on public.tagged_items for update
  using (
    exists (
      select 1 from public.outfits o
      where o.id = outfit_id and o.user_id = auth.uid()
    )
  );

create policy "Owner can delete tagged items"
  on public.tagged_items for delete
  using (
    exists (
      select 1 from public.outfits o
      where o.id = outfit_id and o.user_id = auth.uid()
    )
  );


-- Storage bucket for outfit images. Public-read, owner-write.
insert into storage.buckets (id, name, public)
values ('outfits', 'outfits', true)
on conflict (id) do nothing;

create policy "Outfit images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'outfits');

create policy "Authenticated users can upload to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'outfits'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own files"
  on storage.objects for update
  using (
    bucket_id = 'outfits'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own files"
  on storage.objects for delete
  using (
    bucket_id = 'outfits'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
