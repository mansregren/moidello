/**
 * Common garment colours, shown as clickable swatches in the tag
 * editors (/skapa and the admin outfit editor) instead of a free-text
 * field. The stored value is the English `name` — keeps `tagged_items.color`
 * a plain string and consistent across both surfaces.
 */
// Single-word names only: /farg/[slug] reconstructs the colour name by
// capitalising the slug, so a space would break the round-trip.
export const GARMENT_COLORS = [
  // Neutrals
  { name: "Black", hex: "#1c1c1e" },
  { name: "Charcoal", hex: "#3a3d42" },
  { name: "Grey", hex: "#9ca3af" },
  { name: "Silver", hex: "#c4c7cc" },
  { name: "White", hex: "#f4f4ee" },
  { name: "Cream", hex: "#efe7d3" },
  { name: "Beige", hex: "#d8c9a8" },
  { name: "Camel", hex: "#c19a6b" },
  { name: "Brown", hex: "#6e4f37" },
  { name: "Khaki", hex: "#8a865d" },
  // Blue
  { name: "Navy", hex: "#232f45" },
  { name: "Blue", hex: "#3f6fb0" },
  { name: "Sky", hex: "#9cc4e8" },
  { name: "Denim", hex: "#5a7494" },
  { name: "Petrol", hex: "#1f4e54" },
  { name: "Turquoise", hex: "#2fa6a0" },
  // Green
  { name: "Forest", hex: "#2f4733" },
  { name: "Green", hex: "#4f7355" },
  { name: "Olive", hex: "#5b6236" },
  { name: "Mint", hex: "#b8e0c9" },
  // Warm
  { name: "Burgundy", hex: "#5e1f2a" },
  { name: "Red", hex: "#b1322b" },
  { name: "Coral", hex: "#f08060" },
  { name: "Terracotta", hex: "#b5603f" },
  { name: "Orange", hex: "#d8763f" },
  { name: "Mustard", hex: "#c99a2e" },
  { name: "Yellow", hex: "#e3c44d" },
  // Pink & purple
  { name: "Pink", hex: "#e8aec2" },
  { name: "Magenta", hex: "#b03070" },
  { name: "Purple", hex: "#7a6298" },
  { name: "Lilac", hex: "#c3b1d6" },
] as const;

export type GarmentColor = (typeof GARMENT_COLORS)[number]["name"];

/**
 * Colour was previously stored in Swedish ("Svart", "Beige", …). The
 * public /farg pages and slugs are English, so this maps an English slug
 * back to the legacy Swedish value so a colour query still finds those
 * older rows. New rows are stored in English and match on the slug.
 */
const EN_SLUG_TO_LEGACY: Record<string, string> = {
  black: "svart",
  charcoal: "antracit",
  grey: "grå",
  gray: "grå",
  white: "vit",
  cream: "krämvit",
  camel: "kamel",
  brown: "brun",
  navy: "marinblå",
  blue: "blå",
  sky: "ljusblå",
  turquoise: "turkos",
  forest: "mörkgrön",
  green: "grön",
  olive: "olivgrön",
  mint: "mintgrön",
  burgundy: "vinröd",
  red: "röd",
  coral: "korall",
  terracotta: "terrakotta",
  mustard: "senapsgul",
  yellow: "gul",
  pink: "rosa",
  purple: "lila",
  lilac: "ljuslila",
};

// Reverse of EN_SLUG_TO_LEGACY, first-match-wins so aliases pointing at the
// same Swedish word (grey/gray → grå) resolve to the one that's actually a
// canonical GARMENT_COLORS name ("Grey", not "gray").
const LEGACY_TO_EN: Record<string, string> = {};
for (const [enSlug, svWord] of Object.entries(EN_SLUG_TO_LEGACY)) {
  if (
    !(svWord in LEGACY_TO_EN) &&
    GARMENT_COLORS.some((c) => c.name.toLowerCase() === enSlug)
  ) {
    LEGACY_TO_EN[svWord] = enSlug;
  }
}

/**
 * The values to pass to an ilike colour query for a given /farg slug —
 * both the slug itself and its legacy Swedish equivalent when one exists,
 * so a single canonical page finds rows tagged in either language.
 */
export function colorQueryValues(slug: string): string[] {
  const lower = slug.toLowerCase();
  const legacy = EN_SLUG_TO_LEGACY[lower];
  return legacy ? [lower, legacy] : [lower];
}

/**
 * Resolve a /farg slug (English or legacy Swedish, e.g. "black" or
 * "svart") to its canonical English display name, or null if it isn't a
 * known colour. Keeps old indexed /farg URLs working alongside the new
 * English ones, and stops a Swedish-tagged colour from rendering as its
 * raw Swedish word in a page title.
 */
export function canonicalColorLabel(slug: string): string | null {
  const lower = slug.toLowerCase().trim();
  if (!lower) return null;
  const direct = GARMENT_COLORS.find((c) => c.name.toLowerCase() === lower);
  if (direct) return direct.name;
  const en = LEGACY_TO_EN[lower];
  if (en) {
    return GARMENT_COLORS.find((c) => c.name.toLowerCase() === en)?.name ?? null;
  }
  return null;
}
