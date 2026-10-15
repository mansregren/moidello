import type { Metadata } from "next";
import { fetchOutfitsByGarment } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { garmentsForGender, garmentQueryValues, canonicalGarment } from "@/lib/garments";
import { DAM_PUBLIC } from "@/lib/flags";
import { slugify } from "@/lib/slug";

const SITE = "Moidello";

function resolveGender(slug: string): "dam" | "herr" | null {
  const lower = slug.toLowerCase();
  if (lower === "dam" || lower === "herr") return lower;
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gender: string; garment: string }>;
}): Promise<Metadata> {
  const { gender: g, garment: gs } = await params;
  const gender = resolveGender(g);
  if (!gender) {
    return { title: "Category", robots: { index: false, follow: true } };
  }
  if (gender === "dam" && !DAM_PUBLIC) {
    return { title: "Category", robots: { index: false, follow: false } };
  }
  const garment = canonicalGarment(gs);
  if (!garment) {
    return { title: "Category", robots: { index: false, follow: true } };
  }

  const outfits = await fetchOutfitsByGarment(
    gender,
    garmentQueryValues(garment),
    createPublicClient(),
  );

  const noun = garment.toLowerCase();
  const audience = gender === "herr" ? "men" : "women";
  const canonical = `/typ/${gender}/${slugify(garment)}`;

  if (outfits.length === 0) {
    return {
      title: `${garment} for ${audience} — outfits`,
      description: `No ${audience} outfits with ${noun} yet on ${SITE}.`,
      robots: { index: false, follow: true },
    };
  }

  const title = `${garment} for ${audience} — ${outfits.length} outfit ideas`;
  const description = `Outfit inspiration with ${noun} for ${audience} on ${SITE}. ${outfits.length} styled looks with brand, price and buy links.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function TypLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
