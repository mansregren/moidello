import type { Metadata } from "next";
import { fetchTaggedItemById } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";

const SITE = "Moidello";

/**
 * Build the meta description. Priority:
 *   1. AI-generated long-form `description` (from migration 0036 backfill).
 *   2. Auto-fallback from brand/name/garment/color/material/price.
 *
 * Capped at ~155 chars so the full snippet shows in Google. The fallback
 * is intentionally richer than the old "Brand name. Pris. Se hur det
 * stylas på Moidello." line because Google scores keyword density in
 * meta-description and the old version was too thin to compete.
 */
function buildDescription(item: {
  brand: string;
  name: string;
  garment: string;
  price: number;
  currency: string;
  description?: string | null;
  material?: string | null;
  color?: string | null;
}): string {
  const trimmed = item.description?.trim();
  if (trimmed) return trimmed.slice(0, 200);

  const garmentLower = item.garment?.toLowerCase().trim() ?? "";
  const colorPart = item.color ? `${item.color.toLowerCase()} ` : "";
  const materialPart = item.material ? `i ${item.material.toLowerCase()} ` : "";
  const pricePart =
    item.price > 0
      ? `${item.price.toLocaleString("sv-SE")} ${item.currency}. `
      : "";
  const noun = garmentLower || "plagg";
  return `${item.brand} ${item.name} — ${colorPart}${noun} ${materialPart}stylad i outfits på ${SITE}. ${pricePart}Se färg, passform och fler outfit-idéer.`.slice(
    0,
    200,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await fetchTaggedItemById(id, createPublicClient());

  if (!item) {
    return {
      title: "Plagg hittades inte",
      robots: { index: false, follow: false },
    };
  }

  // Build a richer title than just "Brand Name" — include the garment
  // type and color when present so the SERP entry actually matches what
  // people search for ("beige trenchcoat", "vit linneskjorta"). Capped so
  // Google doesn't truncate before " | Moidello" arrives via template.
  const garmentLower = item.garment?.toLowerCase().trim() ?? "";
  const colorPart = item.color ? `${item.color.toLowerCase()} ` : "";
  const titleParts = [
    colorPart && garmentLower ? `${colorPart.trim()} ${garmentLower}` : "",
    `${item.brand} ${item.name}`,
  ].filter(Boolean);
  const title = titleParts.join(" — ").slice(0, 60);

  const description = buildDescription(item);
  const canonical = `/produkt/${item.id}`;

  // Thin-content guard: noindex if we don't have enough signal (no buy URL,
  // no price, or barely a name) — these pages won't rank and dilute the
  // site's SERP quality.
  const isThin =
    !item.buyUrl ||
    item.price <= 0 ||
    !item.name?.trim() ||
    item.name.trim().length < 3;

  return {
    title,
    description,
    keywords:
      item.keywords && item.keywords.length > 0 ? item.keywords : undefined,
    alternates: { canonical },
    robots: isThin
      ? { index: false, follow: true }
      : { index: true, follow: true },
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
