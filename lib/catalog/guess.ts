/**
 * Heuristics for the plaggbank's paste-a-URL flow: guess garment type and
 * colour from the product name so most drafts need no manual fixing.
 * Pure functions — safe on both server and client.
 */

// Relative import so vitest (no path aliases configured) can load this file.
import { GARMENT_COLORS } from "../colors";

// Order matters: more specific patterns first ("overshirt" before "shirt",
// "t-shirt" before "shirt", "sweatshirt" before "shirt").
const GARMENT_RULES: Array<[RegExp, string]> = [
  // Knitted headwear/scarves would otherwise land in Knitwear.
  [/\bcap\b|beanie|\bhat\b|mössa|keps|scarf|halsduk|\bsocks?\b|strumpor|gloves|handskar/i, "Accessories"],
  [/\b(t-?shirt|tee)s?\b|t-tröja/i, "T-shirt"],
  [/\btank ?top|linne\b/i, "Tank top"],
  [/overshirt|shacket|skjortjacka/i, "Outerwear"],
  [/sweatshirt|crew ?neck|college|\bsweater\b|\btröja\b/i, "Sweater"],
  [/hoodie|hooded|huvtröja|\bhood\b/i, "Hoodie"],
  [/\bpolo/i, "Polo"],
  [/cardigan|\bknit|stickad|kofta|merino|cashmere|kashmir|lammull/i, "Knitwear"],
  [/blazer|kavaj/i, "Blazer"],
  [/\bsuit\b|kostym/i, "Suit"],
  [/jacket|\bcoat\b|jacka|parka|\brock\b|trench|bomber|puffer|anorak|gilet|väst\b|vest\b/i, "Outerwear"],
  [/shirt|skjorta/i, "Shirt"],
  [/blouse|blus/i, "Blouse"],
  [/jeans|denim/i, "Jeans"],
  [/chino/i, "Chinos"],
  [/shorts/i, "Shorts"],
  [/trouser|pants|byxa|byxor|slacks|joggers?/i, "Trousers"],
  [/dress|klänning/i, "Dresses"],
  [/skirt|kjol/i, "Skirt"],
  [/sneaker|\bshoes?\b|boots?\b|loafer|derby|oxford|sandal|\bsko(r)?\b|känga|kängor|stövlar|mules?\b/i, "Shoes"],
  [/\bwatch|klocka/i, "Watch"],
  [/\bring\b|necklace|bracelet|halsband|armband|örhänge|earring|chain\b|kedja/i, "Jewellery"],
  [/\bbag\b|väska|tote|backpack|ryggsäck|weekender/i, "Bags"],
  [/\bcap\b|beanie|\bhat\b|mössa|keps|scarf|halsduk|belt|bälte|sunglasses|solglasögon|socks?\b|strumpor|gloves|handskar|tie\b|slips|wallet|plånbok/i, "Accessories"],
];

export function guessGarment(text: string): string | null {
  for (const [re, garment] of GARMENT_RULES) {
    if (re.test(text)) return garment;
  }
  return null;
}

// Swedish + common retailer colour words → GARMENT_COLORS names.
const COLOR_ALIASES: Record<string, string> = {
  svart: "Black",
  vit: "White",
  vitt: "White",
  "off-white": "Cream",
  offwhite: "Cream",
  ecru: "Cream",
  ivory: "Cream",
  grå: "Grey",
  gray: "Grey",
  gråmelerad: "Grey",
  antracit: "Charcoal",
  anthracite: "Charcoal",
  marinblå: "Navy",
  marin: "Navy",
  blå: "Blue",
  ljusblå: "Sky",
  "light blue": "Sky",
  brun: "Brown",
  chocolate: "Brown",
  sand: "Beige",
  stone: "Beige",
  taupe: "Beige",
  tan: "Camel",
  grön: "Green",
  mörkgrön: "Forest",
  "dark green": "Forest",
  röd: "Red",
  vinröd: "Burgundy",
  bordeaux: "Burgundy",
  wine: "Burgundy",
  rosa: "Pink",
  lila: "Purple",
  gul: "Yellow",
  senap: "Mustard",
  orange: "Orange",
  rost: "Terracotta",
  rust: "Terracotta",
};

/** Map free-text colour (or a product name) to one of GARMENT_COLORS. */
export function guessColor(...texts: Array<string | null | undefined>): string | null {
  for (const raw of texts) {
    if (!raw) continue;
    const t = raw.toLowerCase();
    // Palette names and aliases together, longest term first, so
    // "off-white" beats "white" and "charcoal" beats a stray substring.
    const terms: Array<[string, string]> = [
      ...GARMENT_COLORS.map((c) => [c.name.toLowerCase(), c.name] as [string, string]),
      ...Object.entries(COLOR_ALIASES),
    ].sort((x, y) => y[0].length - x[0].length);
    for (const [term, name] of terms) {
      if (new RegExp(`(^|[^\\p{L}-])${term}([^\\p{L}-]|$)`, "u").test(t)) return name;
    }
  }
  return null;
}

/**
 * Dedupe key for a product URL: lower-case host without www + path without
 * trailing slash. Query/fragment are dropped — they're mostly tracking
 * (gclid, _gl, utm…). Returns null for unparsable input.
 */
export function catalogUrlKey(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const path = u.pathname.replace(/\/+$/, "");
    return `${host}${path}`.slice(0, 2000);
  } catch {
    return null;
  }
}

/** Strip the usual tracking params so stored buy_urls stay clean. */
export function cleanBuyUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    const drop = [/^utm_/, /^gclid$/, /^gbraid$/, /^wbraid$/, /^gad_/, /^_gl$/, /^fbclid$/, /^pr_/, /^mc_/];
    for (const key of [...u.searchParams.keys()]) {
      if (drop.some((re) => re.test(key))) u.searchParams.delete(key);
    }
    u.hash = "";
    return u.toString();
  } catch {
    return raw.trim();
  }
}
