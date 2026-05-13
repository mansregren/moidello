-- Hidden + soft-delete för users på egna posts.
-- Owners kan dölja (försvinner från publika feeds men finns kvar) eller
-- soft-delete (deleted_at sätts, försvinner helt utom för admin restore).

ALTER TABLE public.outfits
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS outfits_deleted_at_idx
  ON public.outfits (deleted_at)
  WHERE deleted_at IS NULL; -- partial: snabba "alive"-queries

-- Uppdatera publika SELECT-policyn så hidden + deleted gömmer sig från
-- alla utom owner/admin. Owner ser sina egna oavsett hidden (men inte
-- om de är soft-deleted). Admin ser allt via existerande policy.

DROP POLICY IF EXISTS "Published outfits are viewable by everyone" ON public.outfits;
CREATE POLICY "Public sees alive published outfits"
  ON public.outfits FOR SELECT
  USING (
    (is_published = true AND is_hidden = false AND deleted_at IS NULL)
    OR auth.uid() = user_id  -- owner ser sina egna även om hidden, men inte deleted
  );

-- Owners kan toggle is_hidden + soft-delete via existerande UPDATE/DELETE-
-- policies. DELETE-policyn (0002) tillåter owner DELETE — vi använder den
-- för soft-delete (UPDATE deleted_at = now()) inte hard delete.

-- Filtrera bort soft-deleted från owner-SELECT också.
DROP POLICY IF EXISTS "Public sees alive published outfits" ON public.outfits;
CREATE POLICY "Public sees alive published outfits"
  ON public.outfits FOR SELECT
  USING (
    (is_published = true AND is_hidden = false AND deleted_at IS NULL)
    OR (auth.uid() = user_id AND deleted_at IS NULL)
  );
