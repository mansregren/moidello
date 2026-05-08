import { fetchBrandsAggregated } from "@/lib/queries";
import BrandsClient, { type BrandRow } from "./BrandsClient";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const aggregated = await fetchBrandsAggregated();

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
