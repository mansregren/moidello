-- Fix Supabase Advisor "Security Definer View" flags (CRITICAL × 5).
--
-- Views were running with the view owner's rights (security definer) which
-- bypasses RLS on their underlying tables. Switching to security_invoker
-- makes each view run with the calling user's rights — RLS is honored.
--
-- The functional gotcha: `outfit_stats.saves` was previously aggregating
-- `public.saves` while bypassing its "Users see own saves" policy. Under
-- invoker, anon and other-user callers see zero rows in `saves`, so the
-- count collapses to 0. To keep public save counts working for everyone
-- without exposing *who* saved what, we maintain a denormalized
-- `outfit_save_counts(outfit_id, count)` table via triggers and let
-- `outfit_stats` join against that instead.
--
-- `brand_dashboard` also relied on definer rights so a brand profile could
-- read `tag_clicks` on outfits they don't own. We replace the bypass with
-- an explicit, scoped RLS policy ("Brand owners see clicks on their
-- brand") and add `p.id = auth.uid()` inside the view as defense in depth.


-- ============================================================
-- 1. outfit_save_counts: public-readable aggregate of saves.
-- ============================================================

create table public.outfit_save_counts (
  outfit_id uuid primary key references public.outfits(id) on delete cascade,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now()
);

-- Backfill from existing saves.
insert into public.outfit_save_counts (outfit_id, count)
select outfit_id, count(*)
from public.saves
group by outfit_id;

alter table public.outfit_save_counts enable row level security;

create policy "Save counts are public"
  on public.outfit_save_counts for select
  using (true);

grant select on public.outfit_save_counts to anon, authenticated;

-- Trigger function. SECURITY DEFINER is fine here — it only mutates an
-- aggregate counter, never exposes save rows.
create or replace function public.bump_outfit_save_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.outfit_save_counts (outfit_id, count)
    values (new.outfit_id, 1)
    on conflict (outfit_id) do update
      set count = outfit_save_counts.count + 1,
          updated_at = now();
    return new;
  elsif tg_op = 'DELETE' then
    update public.outfit_save_counts
      set count = greatest(count - 1, 0),
          updated_at = now()
    where outfit_id = old.outfit_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger saves_bump_count
after insert or delete on public.saves
for each row execute function public.bump_outfit_save_count();


-- ============================================================
-- 2. outfit_stats — invoker + join against outfit_save_counts.
-- ============================================================

create or replace view public.outfit_stats
with (security_invoker = on) as
  select
    o.id as outfit_id,
    coalesce(l.likes, 0) as likes,
    coalesce(sc.count, 0)::bigint as saves,
    coalesce(c.comments, 0) as comments
  from public.outfits o
  left join (
    select outfit_id, count(*) as likes
    from public.likes
    group by outfit_id
  ) l on l.outfit_id = o.id
  left join public.outfit_save_counts sc on sc.outfit_id = o.id
  left join (
    select outfit_id, count(*) as comments
    from public.comments
    group by outfit_id
  ) c on c.outfit_id = o.id;

grant select on public.outfit_stats to anon, authenticated;


-- ============================================================
-- 3. profile_stats — trivial invoker switch.
-- Underlying tables (outfits.is_published, follows) are already public.
-- ============================================================

alter view public.profile_stats set (security_invoker = on);


-- ============================================================
-- 4. board_summary — trivial invoker switch.
-- boards-RLS already enforces "public OR owner".
-- ============================================================

alter view public.board_summary set (security_invoker = on);


-- ============================================================
-- 5. outfit_engagement — trivial invoker switch.
-- All sources (outfit_views, tag_clicks, etc.) are owner-only via RLS,
-- which is exactly the access model this view is meant to enforce.
-- ============================================================

alter view public.outfit_engagement set (security_invoker = on);


-- ============================================================
-- 6. brand_dashboard — invoker + scoped tag_clicks read policy
-- + auth.uid() guard inside the view.
-- ============================================================

-- New policy: brand profiles can read tag_clicks for outfits where their
-- brand is tagged, regardless of who owns the outfit. This is the
-- specific access pattern brand_dashboard needs — codified as RLS
-- instead of a definer bypass.
create policy "Brand owners see clicks on their brand"
  on public.tag_clicks for select
  using (
    exists (
      select 1
      from public.tagged_items ti
      join public.profiles p on lower(p.brand_name) = lower(ti.brand)
      where ti.id = tag_clicks.tag_id
        and p.account_type = 'brand'
        and p.id = auth.uid()
    )
  );

create or replace view public.brand_dashboard
with (security_invoker = on) as
  select
    p.id as brand_profile_id,
    lower(p.brand_name) as brand_key,
    o.id as outfit_id,
    o.user_id as creator_id,
    o.title,
    o.image_url,
    o.created_at,
    coalesce(os.likes, 0) as likes,
    coalesce(os.saves, 0) as saves,
    coalesce(os.comments, 0) as comments,
    (
      select count(*) from public.tag_clicks tc
      join public.tagged_items ti on ti.id = tc.tag_id
      where tc.outfit_id = o.id
        and lower(ti.brand) = lower(p.brand_name)
    ) as brand_clicks
  from public.profiles p
  join public.tagged_items ti on lower(ti.brand) = lower(p.brand_name)
  join public.outfits o on o.id = ti.outfit_id and o.is_published = true
  left join public.outfit_stats os on os.outfit_id = o.id
  where p.account_type = 'brand'
    and p.brand_name is not null
    and p.id = auth.uid()
  group by p.id, p.brand_name, o.id, o.user_id, o.title, o.image_url,
           o.created_at, os.likes, os.saves, os.comments;

grant select on public.brand_dashboard to anon, authenticated;
