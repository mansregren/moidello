-- Translates leftover Swedish taxonomy values that predate the 2026-09-10
-- English-only switch. Doesn't touch slugs or usernames — only the
-- category/garment/color fields that feed page titles, /farg + /typ
-- landing pages, and meta descriptions. Safe to re-run: every branch only
-- fires on the exact legacy Swedish spelling.

-- 1. Home-decor (vertical = 'hem') categories → HOME_CATEGORIES (lib/home-data.ts).
update public.outfits
set category = case category
  when 'Vardagsrum' then 'Living room'
  when 'Sovrum' then 'Bedroom'
  when 'Kök' then 'Kitchen'
  when 'Matplats' then 'Dining'
  when 'Badrum' then 'Bathroom'
  when 'Hall' then 'Hallway'
  when 'Arbetsrum' then 'Home office'
  when 'Balkong & uteplats' then 'Balcony & patio'
  when 'Tavlor/konst' then 'Wall art'
  else category
end
where vertical = 'hem'
  and category in (
    'Vardagsrum', 'Sovrum', 'Kök', 'Matplats', 'Badrum', 'Hall',
    'Arbetsrum', 'Balkong & uteplats', 'Tavlor/konst'
  );

-- 2. Home-decor tagged_items.garment → HOME_ITEM_TYPES (lib/home-data.ts).
update public.tagged_items ti
set garment = case ti.garment
  when 'Belysning' then 'Lighting'
  when 'Bord' then 'Table'
  when 'Dekoration' then 'Decor'
  when 'Fåtölj' then 'Armchair'
  when 'Förvaring' then 'Storage'
  when 'Hylla' then 'Shelf'
  when 'Köksutrustning' then 'Kitchenware'
  when 'Konst & tavlor' then 'Art & prints'
  when 'Sängkläder' then 'Bedding'
  when 'Soffa' then 'Sofa'
  when 'Spegel' then 'Mirror'
  when 'Stol' then 'Chair'
  else ti.garment
end
from public.outfits o
where o.id = ti.outfit_id
  and o.vertical = 'hem'
  and ti.garment in (
    'Belysning', 'Bord', 'Dekoration', 'Fåtölj', 'Förvaring', 'Hylla',
    'Köksutrustning', 'Konst & tavlor', 'Sängkläder', 'Soffa', 'Spegel', 'Stol'
  );

-- 3. Fashion (vertical = 'mode') tagged_items.garment → lib/garments.ts GARMENTS.
update public.tagged_items ti
set garment = case ti.garment
  when 'Accessoarer' then 'Accessories'
  when 'Byxor' then 'Trousers'
  when 'Klänningar' then 'Dresses'
  when 'Kavaj' then 'Blazer'
  when 'Kjol' then 'Skirt'
  when 'Piké' then 'Polo'
  when 'Skjorta' then 'Shirt'
  when 'Skor' then 'Shoes'
  when 'Stickat' then 'Knitwear'
  when 'Toppar' then 'Tops'
  when 'Tröja' then 'Sweater'
  when 'Väskor' then 'Bags'
  when 'Ytterkläder' then 'Outerwear'
  else ti.garment
end
from public.outfits o
where o.id = ti.outfit_id
  and o.vertical = 'mode'
  and ti.garment in (
    'Accessoarer', 'Byxor', 'Klänningar', 'Kavaj', 'Kjol', 'Piké', 'Skjorta',
    'Skor', 'Stickat', 'Toppar', 'Tröja', 'Väskor', 'Ytterkläder'
  );

-- 4. Colors → lib/colors.ts GARMENT_COLORS (palette names only, so every
-- value has a /farg page), across both verticals.
update public.tagged_items
set color = case color
  when 'Svart' then 'Black'
  when 'Vit' then 'White'
  when 'Grå' then 'Grey'
  when 'Brun' then 'Brown'
  when 'Röd' then 'Red'
  when 'Gul' then 'Yellow'
  when 'Rosa' then 'Pink'
  when 'Blå' then 'Blue'
  when 'Grön' then 'Green'
  when 'Ljusblå' then 'Sky'
  when 'Marinblå' then 'Navy'
  when 'Krom' then 'Silver'
  when 'Moccabrun' then 'Brown'
  when 'Nougatbrun' then 'Brown'
  when 'Vinröd' then 'Burgundy'
  when 'Kamel' then 'Camel'
  when 'Brun/beige' then 'Brown'
  else color
end
where color in (
  'Svart', 'Vit', 'Grå', 'Brun', 'Röd', 'Gul', 'Rosa', 'Blå', 'Grön',
  'Ljusblå', 'Marinblå', 'Krom', 'Moccabrun', 'Nougatbrun', 'Vinröd',
  'Kamel', 'Brun/beige'
);

-- 5. Per-row product name / title translations that a dictionary can't
-- cover (Swedish furniture-store product names). Explicit id matches only
-- — never touches slug or username.
update public.outfits set title = 'Office Chair' where id = 'd5abb46a-3efb-4d02-9937-d89771aecbae' and title = 'Kontorsstol';
update public.outfits set title = 'Washly Laundry Basket' where id = '875c087f-85e7-4fb4-bb5f-08720ca583b1' and title = 'Tvättkorg Washly';
update public.outfits set title = 'Canon Lamps' where id = 'e31cb86f-25be-4ae9-8847-7c87afad8205' and title = 'Canon Lampor';
update public.outfits set title = 'BURLESON Armchair' where id = '3937b0dc-c0af-4923-b690-b8f3c8d29cea' and title = 'BURLESON fåtölj';
update public.outfits set title = 'SANDOR Display Cabinet' where id = 'bf87781b-96a1-41d8-b036-12156dc837f3' and title = 'SANDOR vitrinskåp';
update public.outfits set title = 'LAUREN Duvet Set' where id = 'aeb4fa72-4c3a-4fe0-b51c-56e887051a0a' and title = 'LAUREN påslakanset';
update public.outfits set title = 'Ossie Pedestal' where id = 'e3ad752d-a206-475c-8d77-f8e5c0c4cc2a' and title = 'Piedestal Ossie';
update public.outfits set title = 'Gorillan Pre-made Sofa Bed' where id = 'eb232b99-4cc7-4ecf-82d7-98209d62b338' and title = 'Gorillan Pre-made - Bäddsoffa';
update public.outfits set title = 'Canon Floor Lamp' where id = 'ebd63ac1-0d39-40c6-abc0-6ebec43a6b8d' and title = 'Golvlampa Canon';
update public.outfits set title = 'Leggi Armchair' where id = '5da6268e-ea4c-486b-89a3-53910a6895e2' and title = 'Fåtölj Leggi';
update public.outfits set title = 'Adele Table Lamp' where id = '77fed6b8-09bc-43f9-9984-7ac831a8771e' and title = 'Bordslampa Adele';
update public.outfits set title = 'Mikael Armchair' where id = '2b6df96c-b392-4c53-a1e3-21a81a3d5ab9' and title = 'Karmstol Mikael';
update public.outfits set title = 'Manita Coffee Table' where id = '29a8991e-a151-4d6b-a002-e8a8de4ffcb3' and title = 'Soffbord Manita';
update public.outfits set title = 'Stool' where id = '78cfe489-5fbe-44c8-9c80-d34a60f8a9e5' and title = 'Pall';
update public.outfits set title = 'DYVLINGE Swivel Armchair, Kelinge Orange' where id = 'f0c0517b-3a5e-44fd-a2a4-40dfd1065d96' and title = 'DYVLINGE Snurrfåtölj, Kelinge orange';
update public.outfits set title = 'Aarke To-Go Bottle Carbonator Pro Water Bottle' where id = '14228fb5-c973-4dc4-983f-030aadae63fd' and title = 'To-Go Bottle Carbonator Pro vattenflaska från Aarke';
update public.outfits set title = 'The Waiter (Original)' where id = '17978e48-2bfa-4234-84ed-8ca7f2396319' and title = 'Servitören Original';

update public.tagged_items set name = 'Office Chair' where id = '2fc8835b-e246-4690-b1c6-0cd621eb1c3d' and name = 'Kontorsstol';
update public.tagged_items set name = 'Washly Laundry Basket' where id = '37419d1f-f608-4406-b773-44f61a9aed76' and name = 'Tvättkorg Washly';
update public.tagged_items set name = 'Canon Floor Lamp' where id = '277c63f5-84db-46ad-adf9-7bd4dad48596' and name = 'Golvlampa Canon';
update public.tagged_items set name = 'Canon Mini Table Lamp' where id = 'e053f26c-49f3-4515-ad89-b65047229a70' and name = 'Bordslampa Canon Mini';
update public.tagged_items set name = 'BURLESON Armchair' where id = '0762a72b-5a29-4253-b7c9-8680938b1747' and name = 'BURLESON fåtölj';
update public.tagged_items set name = 'SANDOR Display Cabinet' where id = '9206bf2c-6dae-458b-8f31-4c736e629c86' and name = 'SANDOR vitrinskåp';
update public.tagged_items set name = 'LAUREN Duvet Set' where id = '6fbe848b-3a57-4e9d-8cbc-78e1421f6f62' and name = 'LAUREN påslakanset';
update public.tagged_items set name = 'Ossie Pedestal' where id = '263cac47-9a95-4ea1-93d0-41681a2f2456' and name = 'Piedestal Ossie';
update public.tagged_items set name = 'Gorillan Pre-made Sofa Bed' where id = '947424c9-1f82-41e9-9b67-496e2fee9cd4' and name = 'Gorillan Pre-made - Bäddsoffa';
update public.tagged_items set name = 'Canon Floor Lamp' where id = 'c4bfd36a-71b9-4cb2-9178-32dcb915811d' and name = 'Golvlampa Canon';
update public.tagged_items set name = 'Porthole Mirror Small by NOGA' where id = '38541b58-7400-42c8-b961-c4c638761b76' and name = 'Porthole Mirror Small från NOGA';
update public.tagged_items set name = 'Leggi Armchair' where id = '69a35385-b062-4a73-9920-86ba2d77d046' and name = 'Fåtölj Leggi';
update public.tagged_items set name = 'Adele Table Lamp' where id = '90d8b133-603c-42bf-8268-1e5b6c2b0451' and name = 'Bordslampa Adele';
update public.tagged_items set name = 'Mikael Armchair' where id = '565d313b-be1f-401e-8dff-8a92696bb61f' and name = 'Karmstol Mikael';
update public.tagged_items set name = 'Manita Coffee Table 80x80cm' where id = '337ea8ee-ea1d-4e3f-9a93-c022eb0fab93' and name = 'Soffbord Manita 80x80cm';
update public.tagged_items set name = 'Curva Seat Cushion for Stool, Anthracite by AYTM | Rum21.se' where id = 'ee6a3274-a66c-467e-8c1b-2b31cd745672' and name = 'Curva Sittdyna Till Pall, Antracit från AYTM | Rum21.se';
update public.tagged_items set name = 'Shine Decorative Bowl Ø18 cm, Silver' where id = '402b788c-5247-4b23-aabd-19960832f92f' and name = 'Shine dekorationsskål Ø18 cm, Silver';
update public.tagged_items set name = 'DYVLINGE Swivel Armchair - Kelinge Orange' where id = '6285fd6e-9543-4acf-a39b-4dad82de9e00' and name = 'DYVLINGE Snurrfåtölj - Kelinge orange';
update public.tagged_items set name = 'The Waiter (Original)' where id = 'dc6a9888-06ef-474e-9ba2-a44eef91144c' and name = 'Servitören Original';
