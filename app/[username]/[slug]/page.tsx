import { notFound, permanentRedirect } from "next/navigation";
import {
  fetchOutfitBySlug,
  fetchOutfits,
  fetchHomePosts,
  fetchOutfitComments,
  fetchEngagementForViewer,
  isFollowing,
} from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_REGION } from "@/lib/region";
import { isReservedUsername } from "@/lib/reserved-usernames";
import { isCurrentUserAdmin } from "@/lib/admin";
import OutfitDetail from "@/app/outfit/[id]/OutfitDetail";

export const dynamic = "force-dynamic";

export default async function OutfitPageBySlug({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;

  // Defence-in-depth: a reserved name should never reach this route since
  // signup blocks it, but if one slipped in we'd rather 404 than serve.
  if (isReservedUsername(username)) notFound();

  // Canonicalize username casing.
  if (username !== username.toLowerCase()) {
    permanentRedirect(`/${username.toLowerCase()}/${slug}`);
  }

  const outfit = await fetchOutfitBySlug(username, slug);
  if (!outfit) notFound();

  const isHome = outfit.vertical === "hem";
  const [pool, comments, engagement, followingCreator] = await Promise.all([
    // Pull "similar" from the same vertical — a home post must never
    // surface fashion outfits (its gender is a "dam" fallback).
    isHome ? fetchHomePosts(20) : fetchOutfits(20),
    fetchOutfitComments(outfit.id),
    fetchEngagementForViewer([outfit.id]),
    isFollowing(outfit.creator.id),
  ]);

  const similar = (
    isHome
      ? pool.filter((o) => o.id !== outfit.id)
      : pool.filter((o) => o.id !== outfit.id && o.gender === outfit.gender)
  ).slice(0, 3);

  const similarEngagement = await fetchEngagementForViewer(
    similar.map((o) => o.id),
  );

  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  let viewerRegion = DEFAULT_REGION;
  let savedItemIds: string[] = [];
  if (viewer) {
    const [{ data: profileRow }, { data: savedRows }] = await Promise.all([
      supabase
        .from("profiles")
        .select("region")
        .eq("id", viewer.id)
        .maybeSingle(),
      supabase
        .from("saved_items")
        .select("tagged_item_id")
        .eq("user_id", viewer.id)
        .in(
          "tagged_item_id",
          outfit.tags.map((t) => t.id),
        ),
    ]);
    if (profileRow?.region) viewerRegion = profileRow.region as string;
    savedItemIds = (savedRows ?? []).map((r) => r.tagged_item_id as string);
  }

  const viewerIsAdmin = await isCurrentUserAdmin();

  return (
    <OutfitDetail
      outfit={{ ...outfit, comments }}
      similar={similar}
      similarLikedIds={Array.from(similarEngagement.liked)}
      similarSavedIds={Array.from(similarEngagement.saved)}
      initiallyLiked={engagement.liked.has(outfit.id)}
      initiallySaved={engagement.saved.has(outfit.id)}
      initiallyFollowingCreator={followingCreator}
      isPersisted
      viewerRegion={viewerRegion}
      savedItemIds={savedItemIds}
      viewerIsAdmin={viewerIsAdmin}
    />
  );
}
