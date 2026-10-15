import type { Metadata } from "next";
import { fetchOutfitBySlug } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { isReservedUsername } from "@/lib/reserved-usernames";
import { DAM_PUBLIC } from "@/lib/flags";
import { outfitSeoTitle, outfitSeoDescription } from "@/lib/outfit-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}): Promise<Metadata> {
  const { username, slug } = await params;

  if (isReservedUsername(username)) {
    return {
      title: "Not found",
      robots: { index: false, follow: false },
    };
  }

  const outfit = await fetchOutfitBySlug(username, slug, createPublicClient());
  if (!outfit) {
    return {
      title: "Outfit not found",
      robots: { index: false, follow: false },
    };
  }

  const title = outfitSeoTitle(outfit);
  const description = outfitSeoDescription(outfit);
  const canonical = `/${username.toLowerCase()}/${slug}`;
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
    // OG + Twitter images come from opengraph-image.tsx in this route.
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

export default function UsernameSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
