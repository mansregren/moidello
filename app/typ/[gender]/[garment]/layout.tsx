import type { Metadata } from "next";
import { fetchOutfitsByGarment } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { garmentsForGender, garmentQueryValue, canonicalGarment } from "@/lib/garments";
import { DAM_PUBLIC } from "@/lib/flags";

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
    garmentQueryValue(gs),
    createPublicClient(),
  );

  const noun = garment.toLowerCase();
  const audience = gender === "herr" ? "men" : "women";

  if (outfits.length === 0) {
    return {
      title: `${noun} ${audience} — outfits`,
      description: `No ${audience} outfits with ${noun} yet on ${SITE}.`,
      robots: { index: false, follow: true },
    };
  }

  const title = `${noun} for ${audience} — ${outfits.length} outfit ideas`;
  const description = `Outfit inspiration with ${noun} for ${audience} on ${SITE}. ${outfits.length} styled looks with brand, price and buy links.`;

  return {
    title,
    description,
    alternates: { canonical: `/typ/${gender}/${noun}` },
    openGraph: {
      title,
      description,
      url: `/typ/${gender}/${noun}`,
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
