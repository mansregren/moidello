import { notFound } from "next/navigation";
import {
  fetchOutfitById,
  fetchOutfits,
  fetchOutfitComments,
  fetchEngagementForViewer,
} from "@/lib/queries";
import { outfits as mockOutfits } from "@/lib/data";
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

  const [allOutfits, comments, engagement] = await Promise.all([
    fetchOutfits(20),
    dbOutfit ? fetchOutfitComments(outfit.id) : Promise.resolve([]),
    dbOutfit
      ? fetchEngagementForViewer([outfit.id])
      : Promise.resolve({ liked: new Set<string>(), saved: new Set<string>() }),
  ]);

  const similar = (allOutfits.length > 0 ? allOutfits : mockOutfits)
    .filter((o) => o.id !== outfit.id)
    .slice(0, 3);

  return (
    <OutfitDetail
      outfit={{ ...outfit, comments }}
      similar={similar}
      initiallyLiked={engagement.liked.has(outfit.id)}
      initiallySaved={engagement.saved.has(outfit.id)}
      isPersisted={!!dbOutfit}
    />
  );
}
