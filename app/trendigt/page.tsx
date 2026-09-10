import { fetchTopOutfits } from "@/lib/queries";
import {
  fetchTopCreatorsCached,
  fetchBrandsAggregatedCached,
} from "@/lib/queries-cached";
import TrendigtClient from "./TrendigtClient";

// ISR: rankings are the same for everyone; gender + liked/saved apply
// client-side. Cache + background-refresh.
export const dynamic = "force-static";
export const revalidate = 600;

export default async function TrendigtPage() {
  // Fetch brand aggregations per gender so the client can switch without
  // a reload when gender-context changes. Three lists keep a cache-friendly
  // size — each call is cached in lib/queries-cached.
  const [topOutfits, topCreators, brandsAll, brandsDam, brandsHerr] =
    await Promise.all([
      fetchTopOutfits(12),
      fetchTopCreatorsCached(12),
      fetchBrandsAggregatedCached(),
      fetchBrandsAggregatedCached("dam"),
      fetchBrandsAggregatedCached("herr"),
    ]);

  const toUi = (list: typeof brandsAll) =>
    list.slice(0, 6).map((b) => ({
      id: b.slug,
      slug: b.slug,
      name: b.name,
      newOutfits: b.outfitCount,
    }));

  return (
    <TrendigtClient
      outfits={topOutfits}
      creators={topCreators}
      brandsAll={toUi(brandsAll)}
      brandsDam={toUi(brandsDam)}
      brandsHerr={toUi(brandsHerr)}
    />
  );
}
