import type { Metadata } from "next";
import { fetchTaggedItemById } from "@/lib/queries";

const SITE = "Moidello";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await fetchTaggedItemById(id);

  if (!item) {
    return {
      title: "Plagg hittades inte",
      robots: { index: false, follow: false },
    };
  }

  // Root layout's title.template adds " | Moidello" — don't double it.
  const title = `${item.brand} ${item.name}`;
  const priceLabel =
    item.price > 0
      ? `${item.price.toLocaleString("sv-SE")} ${item.currency}. `
      : "";
  const description = `${item.brand} ${item.name}. ${priceLabel}Se hur det stylas på ${SITE}.`;
  const canonical = `/produkt/${item.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${item.brand} ${item.name} på ${SITE}`,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function ProduktLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
