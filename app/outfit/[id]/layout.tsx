import type { Metadata } from "next";
import { fetchOutfitById } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { DAM_PUBLIC } from "@/lib/flags";
import { outfitSeoTitle, outfitSeoDescription } from "@/lib/outfit-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  // Public client — generateMetadata can run during static prerender.
  const outfit = await fetchOutfitById(id, createPublicClient());

  if (!outfit) {
    return {
      title: "Outfit not found",
      robots: { index: false, follow: false },
    };
  }

  // Root layout's metadata.title.template appends " | Moidello" — don't
  // duplicate the suffix here.
  const title = outfitSeoTitle(outfit);
  const description = outfitSeoDescription(outfit);
  // Canonical points at the new /<username>/<slug> URL when available;
  // the page itself 301-redirects there, but search engines that read
  // metadata before following redirects need the canonical too.
  const canonical =
    outfit.slug && outfit.creator.username
      ? `/${outfit.creator.username.toLowerCase()}/${outfit.slug}`
      : `/outfit/${outfit.id}`;

  // Thin-content guard: if the outfit has neither a creator description
  // nor a single tagged item, leave it out of the index until the creator
  // adds more context.
  const hasOwnDescription =
    !!outfit.metaDescription?.trim() || !!outfit.description?.trim();
  const isThin = !hasOwnDescription && outfit.tags.length === 0;
  // Dam is admin-only while DAM_PUBLIC is off: keep those pages reachable
  // but out of the index (they are also left out of the sitemap).
  const damHidden = outfit.gender === "dam" && !DAM_PUBLIC;

  return {
    title,
    description,
    alternates: { canonical },
    robots: isThin || damHidden
      ? { index: false, follow: true }
      : { index: true, follow: true },
    // OG + Twitter images come from opengraph-image.tsx in this route —
    // Next.js auto-populates og:image and twitter:image from the file
    // route, so we omit them here to avoid double-specification.
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function OutfitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
