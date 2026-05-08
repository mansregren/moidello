import { fetchBrandsAggregated } from "@/lib/queries";
import { brands as mockBrands, outfits as mockOutfits } from "@/lib/data";
import BrandsClient, { type BrandRow } from "./BrandsClient";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const aggregated = await fetchBrandsAggregated();

  if (aggregated.length > 0) {
    const rows: BrandRow[] = aggregated.map((a) => ({
      id: a.slug,
      slug: a.slug,
      name: a.name,
      description: a.isClaimed
        ? "Verifierat märke"
        : `${a.outfitCount} ${a.outfitCount === 1 ? "outfit" : "outfits"} taggade`,
      tier: "contemporary",
      outfitCount: a.outfitCount,
      isClaimed: a.isClaimed,
    }));
    return <BrandsClient brands={rows} />;
  }

  // DB has no tagged brands yet — fall back to the curated mock list so
  // the page isn't empty during the early days.
  const rows: BrandRow[] = mockBrands.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    description: b.description,
    tier: b.tier,
    outfitCount: mockOutfits.filter((o) =>
      o.tags.some((t) => t.brand === b.name),
    ).length,
    isClaimed: false,
  }));

  return <BrandsClient brands={rows} />;
}
