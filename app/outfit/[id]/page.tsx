import { notFound, permanentRedirect } from "next/navigation";
import {
  fetchOutfitById,
  fetchOutfits,
  fetchOutfitComments,
  fetchEngagementForViewer,
  isFollowing,
} from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_REGION } from "@/lib/region";
import OutfitDetail from "./OutfitDetail";

export const dynamic = "force-dynamic";

export default async function OutfitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const outfit = await fetchOutfitById(id);
  if (!outfit) notFound();

  // Canonical URL is /<username>/<slug>. 301 every legacy /outfit/<uuid>
  // hit so old shared links + Google's existing index roll over to the
  // new structure without a flicker. Backwards-compat for outfits
  // without a slug (legacy/mock) is preserved by the slug guard.
  if (outfit.slug && outfit.creator.username) {
    permanentRedirect(
      `/${outfit.creator.username.toLowerCase()}/${outfit.slug}`,
    );
  }

  const [allOutfits, comments, engagement, followingCreator] = await Promise.all([
    fetchOutfits(20),
    fetchOutfitComments(outfit.id),
    fetchEngagementForViewer([outfit.id]),
    isFollowing(outfit.creator.id),
  ]);

  const similar = allOutfits.filter((o) => o.id !== outfit.id).slice(0, 3);

  const similarEngagement = await fetchEngagementForViewer(
    similar.map((o) => o.id),
  );

  // Resolve viewer region for region-aware buy URLs + saved-item state
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
    savedItemIds = (savedRows ?? []).map(
      (r) => r.tagged_item_id as string,
    );
  }

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
    />
  );
}
