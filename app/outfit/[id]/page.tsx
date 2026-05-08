import { notFound } from "next/navigation";
import {
  fetchOutfitById,
  fetchOutfits,
  fetchOutfitComments,
  fetchEngagementForViewer,
  isFollowing,
} from "@/lib/queries";
import { outfits as mockOutfits } from "@/lib/data";
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

  // Mock fixtures use ids like "1", "2"; real DB rows are uuids. Fall back to
  // mock data when the id matches a mock outfit and we can't find it in the DB.
  const dbOutfit = await fetchOutfitById(id);
  const mockMatch = mockOutfits.find((o) => o.id === id);

  if (!dbOutfit && !mockMatch) {
    notFound();
  }

  const outfit = dbOutfit ?? mockMatch!;

  const [allOutfits, comments, engagement, followingCreator] = await Promise.all([
    fetchOutfits(20),
    dbOutfit ? fetchOutfitComments(outfit.id) : Promise.resolve([]),
    dbOutfit
      ? fetchEngagementForViewer([outfit.id])
      : Promise.resolve({ liked: new Set<string>(), saved: new Set<string>() }),
    dbOutfit ? isFollowing(outfit.creator.id) : Promise.resolve(false),
  ]);

  const similar = (allOutfits.length > 0 ? allOutfits : mockOutfits)
    .filter((o) => o.id !== outfit.id)
    .slice(0, 3);

  const similarEngagement = await fetchEngagementForViewer(
    similar.filter((o) => /^[0-9a-f-]{36}$/i.test(o.id)).map((o) => o.id),
  );

  // Resolve viewer region for region-aware buy URLs
  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  let viewerRegion = DEFAULT_REGION;
  if (viewer) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("region")
      .eq("id", viewer.id)
      .maybeSingle();
    if (profileRow?.region) viewerRegion = profileRow.region as string;
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
      isPersisted={!!dbOutfit}
      viewerRegion={viewerRegion}
    />
  );
}
