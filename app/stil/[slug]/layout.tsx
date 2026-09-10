import type { Metadata } from "next";
import { fetchOutfitsByCategory } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";

const SITE = "Moidello";

const STYLES: Record<
  string,
  { label: string; description: string; lead: string }
> = {
  minimalism: {
    label: "Minimalism",
    description:
      "Calm palettes, clean lines, neutral colours. Scandinavian minimalism with a focus on fit and material.",
    lead: "Calm palettes and timeless fit",
  },
  vintage: {
    label: "Vintage",
    description:
      "Retro-inspired pieces, second hand and curated older fashion. A style that ages well instead of being replaced.",
    lead: "Second hand and timeless",
  },
  casual: {
    label: "Casual",
    description:
      "Relaxed everyday outfits. Easy to wear, comfortable and practical — without losing the style.",
    lead: "Everyday outfits without effort",
  },
  streetwear: {
    label: "Streetwear",
    description:
      "Urban style with sneakers, oversized fits and statement pieces. Influences from skate, hip-hop and Japanese streets.",
    lead: "Urban style with oversized fits",
  },
  formal: {
    label: "Formal",
    description:
      "Suits, sharp dresses and elegant accessories. Outfits for dinner, work and occasions that ask for more.",
    lead: "Suits and sharp dresses",
  },
  sporty: {
    label: "Sporty",
    description:
      "Athleisure and functional pieces — sportswear that works outside the gym, a light and mobile style.",
    lead: "Athleisure and function",
  },
  preppy: {
    label: "Preppy",
    description:
      "East coast style with knits, chinos, loafers and polo shirts. Classic and effortlessly sophisticated.",
    lead: "East coast classics",
  },
};

function resolveStyle(slug: string) {
  return STYLES[slug.toLowerCase()] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const style = resolveStyle(slug);
  if (!style) {
    return {
      title: "Style",
      robots: { index: false, follow: true },
    };
  }

  const outfits = await fetchOutfitsByCategory(
    style.label,
    undefined,
    createPublicClient(),
  );

  if (outfits.length === 0) {
    return {
      title: `${style.label} — outfit inspiration`,
      description: `No ${style.label.toLowerCase()} outfits yet on ${SITE}.`,
      robots: { index: false, follow: true },
    };
  }

  const title = `${style.label} — ${outfits.length} outfit ideas`;
  const description = `${style.description} Browse ${outfits.length} styled ${style.label.toLowerCase()} outfits on ${SITE}.`;

  return {
    title,
    description,
    alternates: { canonical: `/stil/${slug.toLowerCase()}` },
    openGraph: {
      title,
      description,
      url: `/stil/${slug.toLowerCase()}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function StilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
