-- Layout of an outfit built in /admin/snabb-outfit: which catalog items,
-- where, how big, rotation and canvas colour. Lets the builder reopen a
-- published flatlay and save it again. Null for photo outfits.
alter table public.outfits
  add column if not exists builder_layout jsonb
    check (builder_layout is null or pg_column_size(builder_layout) < 32768);
