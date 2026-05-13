-- Admin read-side: 0026 lets admins UPDATE/DELETE any outfit + tagged_item,
-- but the base SELECT policy on outfits is "published OR own". That meant
-- admins couldn't see drafts uploaded by other users (incl. demo accounts),
-- so they couldn't manage them. Add cross-user SELECT policies for admins.

create policy "Admins can read any outfit"
  on public.outfits for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can read any tagged item"
  on public.tagged_items for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- outfit_engagement is a SECURITY INVOKER view over outfits — once the
-- above policies are in place, admins see every row through it.
