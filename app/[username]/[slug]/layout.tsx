import type { Metadata } from "next";
import { fetchOutfitBySlug } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { isReservedUsername } from "@/lib/reserved-usernames";

const SITE = "Moidello";

function buildDescription(outfit: {
  description: string;
  metaDescription?: string;
  category: string;
  tags: { brand: string; name: string }[];
  creator: { displayName: string };
}): string {
  // Admin-set SEO override wins; then the creator's own description;
  // then an auto-derived line from category + first tagged garments.
  const meta = outfit.metaDescription?.trim();
  if (meta) return meta;
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
  params: Promise<{ username: string; slug: string }>;
}): Promise<Metadata> {
  const { username, slug } = await params;

  if (isReservedUsername(username)) {
    return {
      title: "Hittades inte",
      robots: { index: false, follow: false },
    };
  }

  const outfit = await fetchOutfitBySlug(username, slug, createPublicClient());
  if (!outfit) {
    return {
      title: "Outfit hittades inte",
      robots: { index: false, follow: false },
    };
  }

  const title = `${outfit.title} av ${outfit.creator.displayName}`;
  const description = buildDescription(outfit);
  const canonical = `/${username.toLowerCase()}/${slug}`;
  const hasOwnDescription =
    !!outfit.metaDescription?.trim() || !!outfit.description?.trim();
  const isThin = !hasOwnDescription && outfit.tags.length === 0;

  return {
    title,
    description,
    alternates: { canonical },
    robots: isThin
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
