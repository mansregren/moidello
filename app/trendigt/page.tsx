import {
  fetchTopOutfits,
  fetchEngagementForViewer,
} from "@/lib/queries";
import {
  fetchTopCreatorsCached,
  fetchBrandsAggregatedCached,
} from "@/lib/queries-cached";
import TrendigtClient from "./TrendigtClient";

export const dynamic = "force-dynamic";

export default async function TrendigtPage() {
  const [topOutfits, topCreators, brandAggs] = await Promise.all([
    fetchTopOutfits(12),
    fetchTopCreatorsCached(12),
    fetchBrandsAggregatedCached(),
  ]);

  const brandsForUI = brandAggs.slice(0, 6).map((b) => ({
    id: b.slug,
    slug: b.slug,
    name: b.name,
    newOutfits: b.outfitCount,
  }));

  const { liked, saved } = await fetchEngagementForViewer(
    topOutfits.map((o) => o.id),
  );

  return (
    <TrendigtClient
      outfits={topOutfits}
      creators={topCreators}
      brands={brandsForUI}
      likedIds={Array.from(liked)}
      savedIds={Array.from(saved)}
    />
  );
}
