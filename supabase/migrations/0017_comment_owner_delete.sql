-- Allow the outfit owner to delete comments on their own outfits, in
-- addition to the comment author. Existing "Users delete own comments"
-- policy stays — Postgres OR's all matching policies for the action.

create policy "Outfit owner can delete comments"
  on public.comments for delete
  using (
    exists (
      select 1 from public.outfits o
      where o.id = comments.outfit_id
        and o.user_id = auth.uid()
    )
  );
