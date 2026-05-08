import type { Metadata } from "next";
import { fetchOutfitById } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const outfit = await fetchOutfitById(id);

  if (!outfit) {
    return {
      title: "Outfit hittades inte",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${outfit.title} av ${outfit.creator.displayName}`,
    description: outfit.description,
    alternates: { canonical: `/outfit/${outfit.id}` },
    openGraph: {
      title: `${outfit.title} av ${outfit.creator.displayName}`,
      description: outfit.description,
      url: `/outfit/${outfit.id}`,
      type: "article",
      images: [{ url: outfit.image, alt: outfit.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: outfit.title,
      description: outfit.description,
      images: [outfit.image],
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
