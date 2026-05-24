import { notFound, permanentRedirect } from "next/navigation";
import { fetchProfileByUsername, fetchOutfitsByUser } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { HOME_VERTICAL_PUBLIC } from "@/lib/flags";
import ProfileDetail, { type PublicBoardSummary } from "./ProfileDetail";

// ISR: a creator's profile is public content. Liked/saved + follow state and
// the dam/herr toggle are all client-side now, so cache + background-refresh.
// Public client → no cookies → static render. Hem posts are hidden while the
// vertical is unlaunched (flag, not per-viewer admin) so the cache is correct.
export const dynamic = "force-static";
export const revalidate = 300;

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Canonicalize to lowercase. A 301 makes /profile/EmmaStyle visibly
  // become /profile/emmastyle in the browser bar AND tells search engines
  // there's only one URL for this profile.
  if (username !== username.toLowerCase()) {
    permanentRedirect(`/profile/${username.toLowerCase()}`);
  }

  const client = createPublicClient();
  const profile = await fetchProfileByUsername(username, client);
  if (!profile) notFound();

  const userOutfits = await fetchOutfitsByUser(profile.id, client);

  // Hem posts stay hidden while the vertical is unlaunched. Gated on the flag
  // (not per-viewer admin) so the cached page is correct for everyone; admins
  // manage hem content via /home and /admin.
  const showHome = HOME_VERTICAL_PUBLIC;
  const visibleOutfits = showHome
    ? userOutfits
    : userOutfits.filter((o) => o.vertical !== "hem");

  let publicBoards: PublicBoardSummary[] = [];
  {
    const supabase = client;
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
      outfits={visibleOutfits}
      publicBoards={publicBoards}
      showHome={showHome}
    />
  );
}
