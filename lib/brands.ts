/**
 * Brand names as typed on tags (or scraped from a shop's og:site_name) are
 * messy: "Drakes - UK/ROW", "CAINTÈ" vs "Cainte", "Rolex Pre-Owned". Every
 * variant became its own /brand page, splitting one brand's outfits and
 * links across thin duplicates. canonicalBrand() folds them into one name
 * at read time; the raw value stays in the database.
 */

/** URL slug for a brand name: lowercase ASCII, dash-separated. */
export function brandSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Keyed by the slug of the raw value, so case and accents don't matter.
const ALIASES: Record<string, string> = {
  "drakes-uk-row": "Drake's",
  "drakes-aw26-transitional": "Drake's",
  drakes: "Drake's",
  "anonymous-copenhagen-dk-official-online-store": "Anonymous Copenhagen",
  cainte: "Cainte",
  multimer: "Mutimer",
  illicitbloc: "Illicit Bloc",
  "rolex-pre-owned": "Rolex",
  "omega-pre-owned": "Omega",
  "louis-vuitton-pre-owned": "Louis Vuitton",
  "one-bold-chemist": "One Bold Chemist",
};

// Shop-name suffixes that are never part of the brand.
const SUFFIXES = [
  /\s*[-–|]\s*(uk|eu|us|row|uk\/row|official( online)? (store|shop)|online (store|shop))\s*$/i,
  /\s+official( online)? (store|shop)\s*$/i,
];

export function canonicalBrand(raw: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return trimmed;
  const alias = ALIASES[brandSlug(trimmed)];
  if (alias) return alias;
  let name = trimmed;
  for (const re of SUFFIXES) name = name.replace(re, "");
  return ALIASES[brandSlug(name)] ?? name;
}

/** Slug of the canonical brand — the /brand/<slug> a tag belongs to. */
export function brandHref(raw: string): string {
  return `/brand/${brandSlug(canonicalBrand(raw))}`;
}
