-- Migration 0029: admins kan SELECT alla outfits + tagged_items
-- (matchar redan-finns admin INSERT/UPDATE/DELETE-policies från 0026).
-- Utan dessa ser admins bara published+own drafts → demo-användarnas
-- utkast osynliga.

DROP POLICY IF EXISTS "Admins can read any outfit" ON public.outfits;
CREATE POLICY "Admins can read any outfit"
  ON public.outfits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can read any tagged item" ON public.tagged_items;
CREATE POLICY "Admins can read any tagged item"
  ON public.tagged_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
