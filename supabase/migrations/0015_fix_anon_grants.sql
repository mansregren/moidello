-- Defensive: re-assert SELECT privileges on every public-readable table
-- and view we expose through PostgREST. Same class of bug as 0011 — the
-- default Supabase grants didn't propagate to tables created by later
-- migrations, so anon (and sometimes authenticated) hit
-- "permission denied for table" before RLS even runs.

grant select on public.outfits to anon, authenticated;
grant select on public.tagged_items to anon, authenticated;
grant select on public.likes to anon, authenticated;
grant select on public.comments to anon, authenticated;
grant select on public.follows to anon, authenticated;
grant select on public.outfit_stats to anon, authenticated;
grant select on public.profile_stats to anon, authenticated;
grant select on public.outfit_engagement to anon, authenticated;
grant select on public.brand_dashboard to anon, authenticated;
grant select on public.boards to anon, authenticated;
grant select on public.board_outfits to anon, authenticated;
grant select on public.board_summary to anon, authenticated;

-- Auth-only tables: only authenticated needs read
grant select on public.saves to authenticated;
grant select on public.notifications to authenticated;
grant select on public.conversations to authenticated;
grant select on public.messages to authenticated;
grant select on public.outfit_views to authenticated;
grant select on public.tag_clicks to authenticated;

-- Insert/update/delete privileges so server actions can write through RLS
grant insert, delete on public.likes to authenticated;
grant insert, delete on public.saves to authenticated;
grant insert, delete on public.follows to authenticated;
grant insert, update, delete on public.comments to authenticated;
grant insert, update, delete on public.outfits to authenticated;
grant insert, update, delete on public.tagged_items to authenticated;
grant insert, update, delete on public.boards to authenticated;
grant insert, delete on public.board_outfits to authenticated;
grant insert, update on public.notifications to authenticated;
grant insert, update on public.conversations to authenticated;
grant insert, update on public.messages to authenticated;
grant insert on public.outfit_views to anon, authenticated;
grant insert on public.tag_clicks to anon, authenticated;
