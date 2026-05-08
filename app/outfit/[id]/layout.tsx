import type { Metadata } from "next";
import { fetchOutfitById } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";

const SITE = "Moidello";

function buildDescription(outfit: {
  description: string;
  category: string;
  tags: { brand: string; name: string }[];
  creator: { displayName: string };
}): string {
  // Prefer the creator's own description; fall back to an auto-derived one
  // from category + first three tagged garments.
  const own = outfit.description?.trim();
  if (own) return own;

  const top = outfit.tags
    .slice(0, 3)
    .map((t) => `${t.brand} ${t.name}`)
    .join(", ");
  const cat = outfit.category?.trim();
  if (top && cat) {
    return `En ${cat.toLowerCase()}-outfit med ${top} av ${outfit.creator.displayName}.`;
  }
  if (top) {
    return `Outfit med ${top} av ${outfit.creator.displayName}.`;
  }
  return `Outfit av ${outfit.creator.displayName} på ${SITE}.`;
}

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
      title: "Outfit hittades inte",
      robots: { index: false, follow: false },
    };
  }

  // Root layout's metadata.title.template appends " | Moidello" — don't
  // duplicate the suffix here.
  const title = `${outfit.title} av ${outfit.creator.displayName}`;
  const description = buildDescription(outfit);
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
  const hasOwnDescription = !!outfit.description?.trim();
  const isThin = !hasOwnDescription && outfit.tags.length === 0;

  return {
    title,
    description,
    alternates: { canonical },
    robots: isThin
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
