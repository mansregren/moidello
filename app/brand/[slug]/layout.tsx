import type { Metadata } from "next";
import { fetchBrandsAggregated } from "@/lib/queries";

const SITE = "Moidello";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const aggregated = await fetchBrandsAggregated();
  const brand = aggregated.find((b) => b.slug === slug);

  if (!brand) {
    return {
      title: "Märke hittades inte",
      robots: { index: false, follow: false },
    };
  }

  // Root template appends " | Moidello".
  const title = brand.name;
  const description = brand.isClaimed
    ? `Verifierat märke på ${SITE}. ${brand.outfitCount} ${brand.outfitCount === 1 ? "outfit" : "outfits"} taggade.`
    : `Outfits som taggar ${brand.name} på ${SITE}. ${brand.outfitCount} ${brand.outfitCount === 1 ? "outfit" : "outfits"}.`;
  const canonical = `/brand/${brand.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    // Brands with zero tagged outfits are too thin for the index.
    robots:
      brand.outfitCount === 0
        ? { index: false, follow: true }
        : { index: true, follow: true },
    openGraph: {
      title: `${brand.name} på ${SITE}`,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: brand.name,
      description,
    },
  };
}

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return children;
}
