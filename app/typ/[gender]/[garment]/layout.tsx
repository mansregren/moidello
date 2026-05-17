import type { Metadata } from "next";
import { fetchOutfitsByGarment } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { garmentsForGender } from "@/lib/garments";

const SITE = "Moidello";

function resolveGender(slug: string): "dam" | "herr" | null {
  const lower = slug.toLowerCase();
  if (lower === "dam" || lower === "herr") return lower;
  return null;
}

function slugToGarment(
  slug: string,
  gender: "dam" | "herr",
): string | null {
  const lower = slug.toLowerCase();
  const list = garmentsForGender(gender);
  for (const g of list) {
    if (g.toLowerCase() === lower) return g;
  }
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
    return { title: "Kategori", robots: { index: false, follow: true } };
  }
  const garment = slugToGarment(gs, gender);
  if (!garment) {
    return { title: "Kategori", robots: { index: false, follow: true } };
  }

  const outfits = await fetchOutfitsByGarment(
    gender,
    garment,
    createPublicClient(),
  );

  const noun = garment.toLowerCase();
  const audience = gender === "herr" ? "herr" : "dam";

  if (outfits.length === 0) {
    return {
      title: `${noun} ${audience} — outfits`,
      description: `Inga ${audience}-outfits med ${noun} ännu på ${SITE}.`,
      robots: { index: false, follow: true },
    };
  }

  const title = `${noun} ${audience} — ${outfits.length} outfit-idéer`;
  const description = `Outfit-inspiration med ${noun} för ${audience} från svenska kreatörer på ${SITE}. ${outfits.length} stylade looks med märke, pris och köp-länkar.`;

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
