import { notFound } from "next/navigation";
import {
  fetchProfileByUsername,
  fetchOutfitsByUser,
  fetchEngagementForViewer,
  isFollowing,
} from "@/lib/queries";
import { users as mockUsers, outfits as mockOutfits } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import ProfileDetail, { type PublicBoardSummary } from "./ProfileDetail";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const dbProfile = await fetchProfileByUsername(username);
  const mockMatch = mockUsers.find((u) => u.username === username);
  if (!dbProfile && !mockMatch) notFound();

  const profile = dbProfile ?? mockMatch!;

  const userOutfits = dbProfile
    ? await fetchOutfitsByUser(profile.id)
    : mockOutfits.filter((o) => o.creator.id === profile.id);

  const [{ liked, saved }, alreadyFollowing] = dbProfile
    ? await Promise.all([
        fetchEngagementForViewer(userOutfits.map((o) => o.id)),
        isFollowing(profile.id),
      ])
    : [{ liked: new Set<string>(), saved: new Set<string>() }, false];

  let publicBoards: PublicBoardSummary[] = [];
  if (dbProfile) {
    const supabase = await createClient();
    const { data: boardRows, error: boardError } = await supabase
      .from("board_summary")
      .select("id, name, description, is_public, cover_outfit_id, outfit_count")
      .eq("user_id", profile.id)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (!boardError && boardRows) {
      const coverIds = boardRows
        .map((b) => b.cover_outfit_id as string | null)
        .filter((x): x is string => !!x);
      const coverMap = new Map<string, string>();
      if (coverIds.length > 0) {
        const { data: covers } = await supabase
          .from("outfits")
          .select("id, image_url")
          .in("id", coverIds);
        if (covers) {
          for (const c of covers) coverMap.set(c.id as string, c.image_url as string);
        }
      }
      const boardIdsWithoutCover = boardRows
        .filter((b) => !b.cover_outfit_id)
        .map((b) => b.id as string);
      const fallbackByBoard = new Map<string, string>();
      if (boardIdsWithoutCover.length > 0) {
        const { data: fallback } = await supabase
          .from("board_outfits")
          .select("board_id, outfit:outfits(image_url)")
          .in("board_id", boardIdsWithoutCover)
          .order("added_at", { ascending: false });
        if (fallback) {
          for (const row of fallback as unknown as Array<{
            board_id: string;
            outfit: { image_url: string } | null;
          }>) {
            if (!fallbackByBoard.has(row.board_id) && row.outfit?.image_url) {
              fallbackByBoard.set(row.board_id, row.outfit.image_url);
            }
          }
        }
      }
      publicBoards = boardRows.map((b) => ({
        id: b.id as string,
        name: b.name as string,
        description: (b.description as string | null) ?? null,
        outfitCount: b.outfit_count as number,
        coverImage: b.cover_outfit_id
          ? coverMap.get(b.cover_outfit_id as string) ?? null
          : fallbackByBoard.get(b.id as string) ?? null,
      }));
    }
  }

  return (
    <ProfileDetail
      user={profile}
      outfits={userOutfits}
      likedIds={Array.from(liked)}
      savedIds={Array.from(saved)}
      initiallyFollowing={alreadyFollowing}
      publicBoards={publicBoards}
    />
  );
}
