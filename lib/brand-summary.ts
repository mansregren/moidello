import type { Outfit } from "@/lib/types";
import { brandSlug, canonicalBrand } from "@/lib/brands";
import { canonicalGarment } from "@/lib/garments";

const garmentOf = (g: string) => canonicalGarment(g) ?? g;

/**
 * Everything a brand page says about the brand is derived from how its
 * pieces are actually tagged — no invented copy, so it stays true as the
 * tags change.
 */
export interface BrandSummary {
  /** The brand's own pieces, one per distinct name, most-worn first. */
  pieces: Array<{ id: string; name: string; garment: string; color: string | null; count: number }>;
  /** The brand's garment types, most frequent first. */
  garments: string[];
  /** Garment types worn alongside the brand's pieces. */
  pairedGarments: string[];
  /** Other brands seen in the same outfits. */
  pairedBrands: Array<{ name: string; slug: string; count: number }>;
}

const PLURAL: Record<string, string> = {
  "T-shirt": "T-shirts",
  "Tank top": "tank tops",
  Tops: "tops",
  Shirt: "shirts",
  Blouse: "blouses",
  Polo: "polos",
  Sweater: "sweaters",
  Knitwear: "knitwear",
  Hoodie: "hoodies",
  Blazer: "blazers",
  Dresses: "dresses",
  Skirt: "skirts",
  Jeans: "jeans",
  Trousers: "trousers",
  Chinos: "chinos",
  Shorts: "shorts",
  Outerwear: "outerwear",
  Suit: "suits",
  Shoes: "shoes",
  Bags: "bags",
  Accessories: "accessories",
  Watch: "watches",
  Jewellery: "jewellery",
};

export function garmentPlural(garment: string): string {
  return PLURAL[garment] ?? garment.toLowerCase();
}

/** "a, b and c" */
export function listPhrase(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function ranked(counts: Map<string, number>): string[] {
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

export function summariseBrand(slug: string, outfits: Outfit[]): BrandSummary {
  const pieces = new Map<string, BrandSummary["pieces"][number]>();
  const garments = new Map<string, number>();
  const paired = new Map<string, number>();
  const brands = new Map<string, { name: string; count: number }>();

  for (const outfit of outfits) {
    const own = outfit.tags.filter((t) => brandSlug(canonicalBrand(t.brand)) === slug);
    const others = outfit.tags.filter((t) => brandSlug(canonicalBrand(t.brand)) !== slug);
    for (const t of own) {
      const g = garmentOf(t.garment);
      garments.set(g, (garments.get(g) ?? 0) + 1);
      const key = t.name.trim().toLowerCase();
      const existing = pieces.get(key);
      if (existing) existing.count += 1;
      else pieces.set(key, { id: t.id, name: t.name.trim(), garment: g, color: t.color ?? null, count: 1 });
    }
    // Count each pairing once per outfit so one busy outfit can't dominate.
    for (const g of new Set(others.map((t) => garmentOf(t.garment)))) {
      paired.set(g, (paired.get(g) ?? 0) + 1);
    }
    for (const name of new Set(others.map((t) => canonicalBrand(t.brand)))) {
      const s = brandSlug(name);
      if (!s) continue;
      const entry = brands.get(s) ?? { name, count: 0 };
      entry.count += 1;
      brands.set(s, entry);
    }
  }

  const ownGarments = ranked(garments);
  return {
    pieces: [...pieces.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    garments: ownGarments,
    pairedGarments: ranked(paired).filter((g) => !ownGarments.slice(0, 1).includes(g)),
    pairedBrands: [...brands.entries()]
      .map(([s, v]) => ({ name: v.name, slug: s, count: v.count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}

/** One factual sentence pair for the intro and meta description. */
export function brandIntro(
  name: string,
  outfitCount: number,
  summary: BrandSummary,
  audience: string,
): string {
  const looks = `${outfitCount} ${outfitCount === 1 ? "outfit" : "outfits"}`;
  const parts = [`${looks}${audience} styled with ${name} on Moidello, every piece tagged.`];
  const own = summary.garments.slice(0, 3).map(garmentPlural);
  if (own.length) parts.push(`The ${name} pieces worn most: ${listPhrase(own)}.`);
  const paired = summary.pairedGarments.slice(0, 3).map(garmentPlural);
  if (paired.length) parts.push(`Most often paired with ${listPhrase(paired)}.`);
  return parts.join(" ");
}
