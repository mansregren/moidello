import type { Metadata } from "next";
import { fetchBrandsAggregated } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { PUBLIC_GENDER } from "@/lib/flags";

const SITE = "Moidello";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const aggregated = await fetchBrandsAggregated(createPublicClient(), PUBLIC_GENDER);
  const brand = aggregated.find((b) => b.slug === slug);

  if (!brand) {
    return {
      title: "Brand not found",
      robots: { index: false, follow: false },
    };
  }

  // Root template appends " | Moidello". Lead with what people search
  // for ("<brand> outfits") rather than the bare brand name.
  const audience = PUBLIC_GENDER === "herr" ? " for men" : "";
  const looks = `${brand.outfitCount} styled ${brand.outfitCount === 1 ? "look" : "looks"}`;
  const title =
    brand.outfitCount > 0
      ? `${brand.name} Outfits${audience} — ${looks}`
      : brand.name;
  const description = brand.isClaimed
    ? `Verified brand on ${SITE}. ${looks} featuring ${brand.name}, with every piece tagged.`
    : `How to wear ${brand.name}: ${looks}${audience} on ${SITE}, with every piece tagged so you can see what it is paired with.`;
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
      title: `${brand.name} on ${SITE}`,
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
