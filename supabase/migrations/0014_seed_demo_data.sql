-- Seed demo data: 6 creators + their 19 outfits as real DB rows so
-- like/save/follow/DM work end-to-end against them. Replaces the
-- previous "fake mock data" approach where engagement was localStorage-
-- only because the seed ids weren't valid uuids.
--
-- The auth users are created with a disabled password ('!' bcrypt hash)
-- so nobody can sign in as them — they exist purely to satisfy the
-- profiles foreign key. The on_auth_user_created trigger seeds a default
-- profiles row; this migration then updates it with real username +
-- display name + avatar.
--
-- Idempotent via the early-return check on the emma profile.

do $$
declare
  -- Distinct first-10-char prefixes so the handle_new_user trigger's
  -- 'user_<10 chars>' default username doesn't collide between seeds.
  emma_id uuid := 'e1111111-1111-1111-1111-111111111111';
  oscar_id uuid := 'e2222222-2222-2222-2222-222222222222';
  linnea_id uuid := 'e3333333-3333-3333-3333-333333333333';
  alex_id uuid := 'e4444444-4444-4444-4444-444444444444';
  sofia_id uuid := 'e5555555-5555-5555-5555-555555555555';
  marcus_id uuid := 'e6666666-6666-6666-6666-666666666666';
  o1 uuid := '22222222-2222-2222-2222-000000000001';
  o2 uuid := '22222222-2222-2222-2222-000000000002';
  o3 uuid := '22222222-2222-2222-2222-000000000003';
  o4 uuid := '22222222-2222-2222-2222-000000000004';
  o5 uuid := '22222222-2222-2222-2222-000000000005';
  o6 uuid := '22222222-2222-2222-2222-000000000006';
  o7 uuid := '22222222-2222-2222-2222-000000000007';
  o8 uuid := '22222222-2222-2222-2222-000000000008';
  o9 uuid := '22222222-2222-2222-2222-000000000009';
  o10 uuid := '22222222-2222-2222-2222-000000000010';
  o11 uuid := '22222222-2222-2222-2222-000000000011';
  o12 uuid := '22222222-2222-2222-2222-000000000012';
  o13 uuid := '22222222-2222-2222-2222-000000000013';
  o14 uuid := '22222222-2222-2222-2222-000000000014';
  o15 uuid := '22222222-2222-2222-2222-000000000015';
  o16 uuid := '22222222-2222-2222-2222-000000000016';
  o17 uuid := '22222222-2222-2222-2222-000000000017';
  o18 uuid := '22222222-2222-2222-2222-000000000018';
  o19 uuid := '22222222-2222-2222-2222-000000000019';
begin
  if exists (select 1 from public.profiles where username = 'emmastyle') then
    return;
  end if;

  -- Insert demo auth users. Trigger handle_new_user creates a placeholder
  -- profiles row for each; we update them below.
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values
    (emma_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'emma@demo.moidello.com', '!', now(),
     '{"display_name":"Emma Lindström","avatar_url":"https://i.pravatar.cc/300?img=1"}'::jsonb,
     '{"provider":"demo","providers":["demo"]}'::jsonb,
     now(), now(), '', '', '', ''),
    (oscar_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'oscar@demo.moidello.com', '!', now(),
     '{"display_name":"Oscar Bergman","avatar_url":"https://i.pravatar.cc/300?img=3"}'::jsonb,
     '{"provider":"demo","providers":["demo"]}'::jsonb,
     now(), now(), '', '', '', ''),
    (linnea_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'linnea@demo.moidello.com', '!', now(),
     '{"display_name":"Linnea Johansson","avatar_url":"https://i.pravatar.cc/300?img=5"}'::jsonb,
     '{"provider":"demo","providers":["demo"]}'::jsonb,
     now(), now(), '', '', '', ''),
    (alex_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'alex@demo.moidello.com', '!', now(),
     '{"display_name":"Alex Nilsson","avatar_url":"https://i.pravatar.cc/300?img=8"}'::jsonb,
     '{"provider":"demo","providers":["demo"]}'::jsonb,
     now(), now(), '', '', '', ''),
    (sofia_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'sofia@demo.moidello.com', '!', now(),
     '{"display_name":"Sofia Eriksson","avatar_url":"https://i.pravatar.cc/300?img=9"}'::jsonb,
     '{"provider":"demo","providers":["demo"]}'::jsonb,
     now(), now(), '', '', '', ''),
    (marcus_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'marcus@demo.moidello.com', '!', now(),
     '{"display_name":"Marcus Holm","avatar_url":"https://i.pravatar.cc/300?img=12"}'::jsonb,
     '{"provider":"demo","providers":["demo"]}'::jsonb,
     now(), now(), '', '', '', '')
  on conflict (id) do nothing;

  -- Update profiles with real username/display name/avatar/bio.
  update public.profiles set
    username = 'emmastyle',
    display_name = 'Emma Lindström',
    avatar_url = 'https://i.pravatar.cc/300?img=1',
    bio = 'Stockholm-based fashion lover. Minimalism meets streetwear.'
  where id = emma_id;

  update public.profiles set
    username = 'oscarwears',
    display_name = 'Oscar Bergman',
    avatar_url = 'https://i.pravatar.cc/300?img=3',
    bio = 'Menswear enthusiast. Vintage finds & tailored looks.'
  where id = oscar_id;

  update public.profiles set
    username = 'linneaslook',
    display_name = 'Linnea Johansson',
    avatar_url = 'https://i.pravatar.cc/300?img=5',
    bio = 'Casual everyday inspo. Keeping it real & comfy.'
  where id = linnea_id;

  update public.profiles set
    username = 'alexfashion',
    display_name = 'Alex Nilsson',
    avatar_url = 'https://i.pravatar.cc/300?img=8',
    bio = 'Streetwear | Sneakers | Culture'
  where id = alex_id;

  update public.profiles set
    username = 'sofiavintage',
    display_name = 'Sofia Eriksson',
    avatar_url = 'https://i.pravatar.cc/300?img=9',
    bio = 'Thrift queen. Every piece has a story.'
  where id = sofia_id;

  update public.profiles set
    username = 'marcusprep',
    display_name = 'Marcus Holm',
    avatar_url = 'https://i.pravatar.cc/300?img=12',
    bio = 'Preppy Scandinavian style. Less is more.'
  where id = marcus_id;

  -- Insert outfits. image_path uses a 'demo/' prefix since these aren't
  -- in the actual storage bucket — the image_url under /images/ is what
  -- next/image actually loads.
  insert into public.outfits (id, user_id, image_url, image_path, type, gender, title, description, category, is_published, created_at) values
    (o1, oscar_id, '/images/outfit-linen.webp', 'demo/outfit-linen.webp', 'photo', 'herr', 'Linen & Navy',
     'Avslappnad sommarelegans. Marinblå skjorta med linnebyxor och boat shoes.',
     'Casual', true, '2025-10-16T12:00:00Z'),
    (o2, alex_id, '/images/outfit-stone-island.webp', 'demo/outfit-stone-island.webp', 'photo', 'herr', 'Stone Island Basics',
     'Klassisk Stone Island-sweatshirt med vintage denim och svarta boots.',
     'Streetwear', true, '2025-10-15T12:00:00Z'),
    (o3, marcus_id, '/images/outfit-denim-loafers.png', 'demo/outfit-denim-loafers.png', 'photo', 'herr', 'Denim & Suede',
     'Chambray-skjorta, gröna byxor och bruna mocka-loafers. Smart casual på riktigt.',
     'Casual', true, '2025-10-14T12:00:00Z'),
    (o4, emma_id, '/images/outfit-brown-linen.png', 'demo/outfit-brown-linen.png', 'photo', 'herr', 'Chocolate Linen',
     'Mörkt chokladbrunt linne med vit t-shirt och mocka-loafers. Riviera-vibes.',
     'Minimalism', true, '2025-10-13T12:00:00Z'),
    (o5, linnea_id, '/images/outfit-beige-suit.png', 'demo/outfit-beige-suit.png', 'photo', 'herr', 'Linen Suit Terrace',
     'Beige linne-kostym med brun slips och mocka-loafers. Perfekt för sommarfest.',
     'Formal', true, '2025-10-12T12:00:00Z'),
    (o6, linnea_id, '/images/outfit-beige-suit-2.png', 'demo/outfit-beige-suit-2.png', 'photo', 'herr', 'Mediterranean Summer',
     'Samma kostym, annan vinkel. Beige linne i solsken.',
     'Formal', true, '2025-10-11T12:00:00Z'),
    (o7, sofia_id, '/images/outfit-knit-linen.jpg', 'demo/outfit-knit-linen.jpg', 'photo', 'herr', 'Knit & Linen',
     'Stickad polo med beige linnebyxor och mocka-loafers. Enkel men elegant.',
     'Minimalism', true, '2025-10-10T12:00:00Z'),
    (o8, oscar_id, '/images/outfit-striped-shirt.jpg', 'demo/outfit-striped-shirt.jpg', 'photo', 'herr', 'Riviera Stripes',
     'Randig linneskjorta med marinblå chinos och solglasögon. Medelhavskänsla.',
     'Casual', true, '2025-10-09T12:00:00Z'),
    (o9, alex_id, '/images/outfit-resort.jpg', 'demo/outfit-resort.jpg', 'photo', 'herr', 'Resort Set',
     'Matchande set i brun stickad kvalitet med camp collar. Strand till bar.',
     'Casual', true, '2025-10-08T12:00:00Z'),
    (o10, emma_id, '/images/w-venice-cardigan.jpg', 'demo/w-venice-cardigan.jpg', 'photo', 'dam', 'Venice Cardigan',
     'Krämfärgad cardigan med vit linne och beige kjol vid kanalen i Venedig.',
     'Minimalism', true, '2025-10-16T12:00:00Z'),
    (o11, linnea_id, '/images/w-acme-studios.webp', 'demo/w-acme-studios.webp', 'photo', 'dam', 'Acme Studios Summer',
     'Gul oversized tröja med spetskjol. Gelato i handen, sommaren i hjärtat.',
     'Casual', true, '2025-10-15T12:00:00Z'),
    (o12, sofia_id, '/images/w-scarf-trousers.jpg', 'demo/w-scarf-trousers.jpg', 'photo', 'dam', 'Scarf & Trousers',
     'Svart linne med beige byxor och sidenscarf. Klassisk europeisk stil.',
     'Minimalism', true, '2025-10-14T12:00:00Z'),
    (o13, linnea_id, '/images/w-scarf-shorts.jpg', 'demo/w-scarf-shorts.jpg', 'photo', 'dam', 'Scarf & Leather Shorts',
     'Vit oversized tee med leopardscarf och svarta läder-shorts. Edgy glam.',
     'Casual', true, '2025-10-13T12:00:00Z'),
    (o14, sofia_id, '/images/w-leopard-scarf.png', 'demo/w-leopard-scarf.png', 'photo', 'dam', 'Leopard & Denim',
     'Vit tee, leopardscarf och vintage jeans. Enkelt med edge.',
     'Casual', true, '2025-10-12T12:00:00Z'),
    (o15, emma_id, '/images/w-suede-jacket.jpg', 'demo/w-suede-jacket.jpg', 'photo', 'dam', 'Suede & Coffee',
     'Beige mockajacka med vit top, prickig scarf och jeans. Fika-outfit.',
     'Casual', true, '2025-10-11T12:00:00Z'),
    (o16, emma_id, '/images/w-olive-jacket.png', 'demo/w-olive-jacket.png', 'photo', 'dam', 'Olive & Coffee',
     'Olivgrön mockajacka med ljusa jeans och kaffe. Coolt och avslappnat.',
     'Streetwear', true, '2025-10-10T12:00:00Z'),
    (o17, sofia_id, '/images/w-beige-bomber.jpg', 'demo/w-beige-bomber.jpg', 'photo', 'dam', 'Beige Bomber Street',
     'Beige mocka-bomber med wide leg jeans och mintgrön väska. Stockholm street style.',
     'Streetwear', true, '2025-10-09T12:00:00Z'),
    (o18, linnea_id, '/images/w-striped-paris.jpg', 'demo/w-striped-paris.jpg', 'photo', 'dam', 'Paris Stripes',
     'Randig skjorta med bruna vida byxor och Adidas Samba. Parisisk street.',
     'Casual', true, '2025-10-08T12:00:00Z'),
    (o19, emma_id, '/images/w-cafe-blouse.jpg', 'demo/w-cafe-blouse.jpg', 'photo', 'dam', 'Café Blouse',
     'Vit volangblus med svart kashmir-sjal och ljusa jeans. Kafémoment.',
     'Minimalism', true, '2025-10-07T12:00:00Z')
  on conflict (id) do nothing;

  -- Tagged items. UUIDs auto-generated since we don't reference them.
  insert into public.tagged_items (outfit_id, brand, name, price, currency, buy_url, garment, position_x, position_y) values
    (o1, 'Morris', 'Textured Shirt Navy', 1299, 'SEK', '#', 'Toppar', 48, 32),
    (o1, 'Arket', 'Linen Trousers', 890, 'SEK', '#', 'Byxor', 45, 65),
    (o1, 'Paraboot', 'Barth Boat Shoe', 3200, 'SEK', '#', 'Skor', 50, 90),
    (o2, 'Stone Island', 'Crewneck Sweatshirt', 2990, 'SEK', '#', 'Toppar', 48, 30),
    (o2, 'Levi''s', '501 Original Jeans', 1190, 'SEK', '#', 'Byxor', 45, 65),
    (o2, 'Danner', 'Mountain Light Boot', 4500, 'SEK', '#', 'Skor', 50, 90),
    (o3, 'Drake''s', 'Chambray BD Shirt', 2100, 'SEK', '#', 'Toppar', 48, 28),
    (o3, 'Incotex', 'Slim Trousers Green', 2400, 'SEK', '#', 'Byxor', 45, 58),
    (o3, 'Carmina', 'Suede Penny Loafer', 3600, 'SEK', '#', 'Skor', 50, 88),
    (o3, 'Anderson''s', 'Braided Leather Belt', 890, 'SEK', '#', 'Accessoarer', 50, 42),
    (o4, 'De Petrillo', 'Linen Trousers Brown', 3200, 'SEK', '#', 'Byxor', 48, 55),
    (o4, 'Sunspel', 'Riviera T-shirt', 790, 'SEK', '#', 'Toppar', 50, 22),
    (o4, 'Edward Green', 'Suede Loafers', 6800, 'SEK', '#', 'Skor', 48, 88),
    (o5, 'Oscar Jacobson', 'Linen Suit Beige', 5990, 'SEK', '#', 'Ytterkläder', 45, 40),
    (o5, 'Drake''s', 'Silk Knit Tie Brown', 1490, 'SEK', '#', 'Accessoarer', 50, 35),
    (o5, 'Crockett & Jones', 'Suede Loafers', 4900, 'SEK', '#', 'Skor', 50, 88),
    (o5, 'Stenströms', 'White Poplin Shirt', 1590, 'SEK', '#', 'Toppar', 48, 30),
    (o6, 'Oscar Jacobson', 'Linen Suit Beige', 5990, 'SEK', '#', 'Ytterkläder', 45, 40),
    (o6, 'Drake''s', 'Silk Knit Tie Brown', 1490, 'SEK', '#', 'Accessoarer', 48, 35),
    (o7, 'Gran Sasso', 'Knitted Polo Beige', 1890, 'SEK', '#', 'Toppar', 48, 22),
    (o7, 'Arket', 'Drawstring Linen Trousers', 990, 'SEK', '#', 'Byxor', 45, 58),
    (o7, 'Loake', 'Suede Penny Loafer', 2800, 'SEK', '#', 'Skor', 48, 88),
    (o8, 'Stenströms', 'Striped Linen Shirt', 1790, 'SEK', '#', 'Toppar', 48, 42),
    (o8, 'Incotex', 'Navy Chinos', 2200, 'SEK', '#', 'Byxor', 45, 75),
    (o8, 'Garrett Leight', 'Hampton Sunglasses', 2800, 'SEK', '#', 'Accessoarer', 50, 18),
    (o9, 'OAS', 'Knitted Camp Shirt Brown', 1290, 'SEK', '#', 'Toppar', 48, 38),
    (o9, 'OAS', 'Knitted Shorts Brown', 990, 'SEK', '#', 'Byxor', 45, 68),
    (o9, 'Mismo', 'Canvas Tote Bag', 1590, 'SEK', '#', 'Väskor', 30, 42),
    (o10, 'Totême', 'Cashmere Cardigan', 4900, 'SEK', '#', 'Ytterkläder', 40, 35),
    (o10, 'Dior', 'Ribbed Tank Top', 890, 'SEK', '#', 'Toppar', 48, 48),
    (o10, 'The Row', 'Tailored Skirt Beige', 5200, 'SEK', '#', 'Klänningar', 45, 68),
    (o10, 'Celine', 'Mini Saddle Bag', 14500, 'SEK', '#', 'Väskor', 55, 55),
    (o11, 'Acme Studios', 'Oversized Knit Yellow', 1890, 'SEK', '#', 'Toppar', 48, 40),
    (o11, 'Ganni', 'Lace Mini Skirt White', 1290, 'SEK', '#', 'Klänningar', 45, 72),
    (o11, 'Chanel', 'Classic Flap Mini', 42000, 'SEK', '#', 'Väskor', 58, 55),
    (o12, 'Totême', 'Ribbed Tank Black', 590, 'SEK', '#', 'Toppar', 48, 30),
    (o12, 'Max Mara', 'Wide Leg Trousers Beige', 3900, 'SEK', '#', 'Byxor', 45, 62),
    (o12, 'Hermès', 'Silk Scarf', 4200, 'SEK', '#', 'Accessoarer', 50, 22),
    (o12, 'Celine', 'Triomphe Bag', 18900, 'SEK', '#', 'Väskor', 30, 45),
    (o13, 'The Frankie Shop', 'Oversized Tee White', 590, 'SEK', '#', 'Toppar', 48, 38),
    (o13, 'Sandro', 'Leather Shorts Black', 2900, 'SEK', '#', 'Byxor', 45, 65),
    (o13, 'Totême', 'Leopard Silk Scarf', 1890, 'SEK', '#', 'Accessoarer', 50, 28),
    (o14, 'Hanes', 'Classic White Tee', 290, 'SEK', '#', 'Toppar', 48, 35),
    (o14, 'Totême', 'Leopard Scarf', 1890, 'SEK', '#', 'Accessoarer', 50, 25),
    (o14, 'Agolde', 'Vintage Jeans', 2200, 'SEK', '#', 'Byxor', 45, 70),
    (o15, 'Sézane', 'Suede Jacket Beige', 3400, 'SEK', '#', 'Ytterkläder', 45, 35),
    (o15, 'Arket', 'White Ribbed Top', 290, 'SEK', '#', 'Toppar', 48, 50),
    (o15, 'Mulberry', 'Suede Shoulder Bag', 7900, 'SEK', '#', 'Väskor', 35, 52),
    (o16, 'Acne Studios', 'Suede Bomber Olive', 8900, 'SEK', '#', 'Ytterkläder', 48, 40),
    (o16, 'Agolde', '90s Straight Jeans', 2400, 'SEK', '#', 'Byxor', 45, 72),
    (o16, 'Celine', 'Cat Eye Sunglasses', 3200, 'SEK', '#', 'Accessoarer', 50, 18),
    (o17, 'Stand Studio', 'Suede Bomber Beige', 4900, 'SEK', '#', 'Ytterkläder', 48, 35),
    (o17, 'Citizens of Humanity', 'Wide Leg Jeans', 2800, 'SEK', '#', 'Byxor', 45, 68),
    (o17, 'Bottega Veneta', 'Mini Pouch Mint', 9800, 'SEK', '#', 'Väskor', 55, 48),
    (o18, 'Samsøe Samsøe', 'Striped Shirt', 1290, 'SEK', '#', 'Toppar', 48, 32),
    (o18, 'Filippa K', 'Wide Trousers Brown', 2200, 'SEK', '#', 'Byxor', 45, 62),
    (o18, 'Adidas', 'Samba OG', 1199, 'SEK', '#', 'Skor', 48, 88),
    (o18, 'Polène', 'Cyme Bag Black', 3900, 'SEK', '#', 'Väskor', 30, 50),
    (o19, '& Other Stories', 'Volume Sleeve Blouse', 890, 'SEK', '#', 'Toppar', 48, 45),
    (o19, 'Johnstons of Elgin', 'Cashmere Shawl Black', 2900, 'SEK', '#', 'Accessoarer', 42, 35),
    (o19, 'Citizens of Humanity', 'Charlotte Jeans', 2600, 'SEK', '#', 'Byxor', 45, 72);
end $$;
