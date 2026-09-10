/**
 * Garment-type options for the tag editors (/skapa, admin outfit editor).
 * Split by gender — a men's outfit shouldn't offer Dresses/Skirt, a
 * women's outfit shouldn't be missing them.
 */
export const GARMENTS_DAM = [
  "T-shirt",
  "Tank top",
  "Tops",
  "Shirt",
  "Blouse",
  "Polo",
  "Sweater",
  "Knitwear",
  "Hoodie",
  "Blazer",
  "Dresses",
  "Skirt",
  "Jeans",
  "Trousers",
  "Shorts",
  "Outerwear",
  "Suit",
  "Shoes",
  "Bags",
  "Accessories",
  "Jewellery",
] as const;

export const GARMENTS_HERR = [
  "T-shirt",
  "Tank top",
  "Shirt",
  "Polo",
  "Sweater",
  "Knitwear",
  "Hoodie",
  "Blazer",
  "Jeans",
  "Trousers",
  "Chinos",
  "Shorts",
  "Outerwear",
  "Suit",
  "Shoes",
  "Bags",
  "Accessories",
  "Watch",
  "Jewellery",
] as const;

/** Union of both — used by the discover filter, which must cover every
 *  value that could be stored on a tagged_item regardless of gender. */
export const GARMENTS = Array.from(
  new Set<string>([...GARMENTS_DAM, ...GARMENTS_HERR]),
);

export type Gender = "dam" | "herr";

/** The garment list for a given gender. */
export function garmentsForGender(gender: Gender): readonly string[] {
  return gender === "herr" ? GARMENTS_HERR : GARMENTS_DAM;
}

/**
 * Garment options for a `<select>`. Returns the gendered list, but if the
 * tag already has a value not in that list (legacy data, or a value from
 * the other gender), prepend it so the select still shows it and editing
 * the rest of the tag doesn't silently drop it.
 */
export function garmentOptions(
  gender: Gender,
  current?: string | null,
): readonly string[] {
  const base = garmentsForGender(gender);
  if (current && !base.includes(current)) return [current, ...base];
  return base;
}

/**
 * Garment was previously stored in Swedish ("Byxor", "Skjorta", …). The
 * public /typ pages and slugs are English, so this maps an English garment
 * slug back to the legacy Swedish value so a garment query still finds
 * those older rows. New rows are stored in English and match directly.
 */
const EN_SLUG_TO_LEGACY_GARMENT: Record<string, string> = {
  "tank top": "linne",
  "tops": "toppar",
  "shirt": "skjorta",
  "blouse": "blus",
  "polo": "piké",
  "sweater": "tröja",
  "knitwear": "stickat",
  "hoodie": "huvtröja",
  "blazer": "kavaj",
  "dresses": "klänningar",
  "skirt": "kjol",
  "trousers": "byxor",
  "shorts": "shorts",
  "outerwear": "ytterkläder",
  "suit": "kostym",
  "shoes": "skor",
  "bags": "väskor",
  "accessories": "accessoarer",
  "jewellery": "smycken",
  "watch": "klocka",
};

/**
 * The value to pass to an ilike garment query for a given /typ slug.
 * Returns the legacy Swedish term when one is known, otherwise the slug
 * itself (which matches English-entered rows).
 */
export function garmentQueryValue(slug: string): string {
  const lower = slug.toLowerCase();
  return EN_SLUG_TO_LEGACY_GARMENT[lower] ?? lower;
}

const LEGACY_GARMENT_TO_EN: Record<string, string> = Object.fromEntries(
  Object.entries(EN_SLUG_TO_LEGACY_GARMENT).map(([en, sv]) => [sv, en]),
);
// Same-in-both slugs that never appear in the legacy map.
const PASSTHROUGH_GARMENT_SLUGS = new Set([
  "t-shirt",
  "jeans",
  "chinos",
  "shorts",
]);

/**
 * Resolve a /typ garment slug (English or legacy Swedish, e.g. "trousers"
 * or "byxor") to its canonical English label for display, or null if it
 * isn't a known garment. Keeps old indexed /typ URLs working alongside the
 * new English ones.
 */
export function canonicalGarment(slug: string): string | null {
  const lower = slug.toLowerCase().trim();
  if (!lower) return null;
  const direct = GARMENTS.find((g) => g.toLowerCase() === lower);
  if (direct) return direct;
  if (LEGACY_GARMENT_TO_EN[lower]) {
    const en = LEGACY_GARMENT_TO_EN[lower];
    return GARMENTS.find((g) => g.toLowerCase() === en) ?? null;
  }
  if (PASSTHROUGH_GARMENT_SLUGS.has(lower)) {
    return GARMENTS.find((g) => g.toLowerCase() === lower) ?? null;
  }
  return null;
}
