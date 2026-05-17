import type { Metadata } from "next";
import { fetchOutfitsByColor } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { slugify } from "@/lib/slug";

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
    color,
    undefined,
    createPublicClient(),
  );

  if (outfits.length === 0) {
    return {
      title: `Outfits i ${color.toLowerCase()}`,
      description: `Inga outfits i ${color.toLowerCase()} ännu — bli först med att tagga ett plagg.`,
      robots: { index: false, follow: true },
    };
  }

  const title = `${color}a outfits — ${outfits.length} stilade looks`;
  const description = `Outfit-inspiration med ${color.toLowerCase()}a plagg från svenska kreatörer på ${SITE}. ${outfits.length} stylade looks med brand-info, pris och köp-länkar.`;

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
