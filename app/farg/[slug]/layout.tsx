import type { Metadata } from "next";
import { fetchOutfitsByColor } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { slugify } from "@/lib/slug";
import { colorQueryValue } from "@/lib/colors";

const SITE = "Moidello";

function slugToColor(slug: string): string {
  const lower = slug.toLowerCase();
  if (!lower) return "";
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const color = slugToColor(slug);
  const outfits = await fetchOutfitsByColor(
    colorQueryValue(slug),
    undefined,
    createPublicClient(),
  );

  if (outfits.length === 0) {
    return {
      title: `Outfits in ${color.toLowerCase()}`,
      description: `No outfits in ${color.toLowerCase()} yet — be the first to tag a piece.`,
      robots: { index: false, follow: true },
    };
  }

  const title = `${color} outfits — ${outfits.length} styled looks`;
  const description = `Outfit inspiration with ${color.toLowerCase()} pieces on ${SITE}. ${outfits.length} styled looks with brand info, price and buy links.`;

  return {
    title,
    description,
    alternates: { canonical: `/farg/${slugify(color)}` },
    openGraph: {
      title,
      description,
      url: `/farg/${slugify(color)}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function FargLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
