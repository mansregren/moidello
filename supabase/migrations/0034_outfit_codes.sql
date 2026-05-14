-- Short human-readable codes for outfits (e.g. A271): 1 letter + 3 digits,
-- sequential. Referenced from socials so people can look an outfit up in search.

create sequence if not exists outfit_code_seq;

create or replace function next_outfit_code() returns text
language sql volatile as $$
  select chr(65 + ((n - 1) / 999)::int)
       || lpad((((n - 1) % 999) + 1)::text, 3, '0')
  from (select nextval('outfit_code_seq') as n) s;
$$;

alter table outfits add column if not exists code text;

-- Backfill existing rows in creation order.
do $$
declare r record;
begin
  for r in select id from outfits where code is null order by created_at, id loop
    update outfits set code = next_outfit_code() where id = r.id;
  end loop;
end $$;

alter table outfits alter column code set default next_outfit_code();
alter table outfits alter column code set not null;
create unique index if not exists outfits_code_key on outfits (code);

grant usage on sequence outfit_code_seq to anon, authenticated, service_role;
grant execute on function next_outfit_code() to anon, authenticated, service_role;
