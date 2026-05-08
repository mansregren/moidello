import {
  fetchTopOutfits,
  fetchTopCreators,
  fetchBrandsAggregated,
  fetchEngagementForViewer,
} from "@/lib/queries";
import {
  outfits as mockOutfits,
  users as mockUsers,
  brands as mockBrands,
} from "@/lib/data";
import TrendigtClient from "./TrendigtClient";

export const dynamic = "force-dynamic";

export default async function TrendigtPage() {
  const [topOutfits, topCreators, brandAggs] = await Promise.all([
    fetchTopOutfits(12),
    fetchTopCreators(12),
    fetchBrandsAggregated(),
  ]);

  const outfitsForUI = topOutfits.length > 0 ? topOutfits : mockOutfits;
  const creatorsForUI =
    topCreators.length > 0
      ? topCreators
      : mockUsers
          .slice()
          .sort((a, b) => b.followers - a.followers)
          .slice(0, 12);
  const brandsForUI =
    brandAggs.length > 0
      ? brandAggs.slice(0, 6).map((b) => ({
          id: b.slug,
          slug: b.slug,
          name: b.name,
          newOutfits: b.outfitCount,
        }))
      : mockBrands.slice(0, 6).map((b, i) => ({
          id: b.id,
          slug: b.slug,
          name: b.name,
          newOutfits: 80 - i * 9,
        }));

  const { liked, saved } = await fetchEngagementForViewer(
    topOutfits.map((o) => o.id),
  );

  return (
    <TrendigtClient
      outfits={outfitsForUI}
      creators={creatorsForUI}
      brands={brandsForUI}
      likedIds={Array.from(liked)}
      savedIds={Array.from(saved)}
    />
  );
}
