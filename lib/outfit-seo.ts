import type { Outfit } from "@/lib/types";
import { canonicalGarment } from "@/lib/garments";
import { canonicalColorLabel } from "@/lib/colors";
import { HIDE_CREATORS } from "@/lib/flags";

/**
 * Search-facing title + meta description for an outfit page, derived from
 * its tagged pieces so every outfit (including future ones) gets a title
 * that matches how people search ("men's outfit with suede jacket and
 * wide-leg jeans") instead of only the editorial name ("Ash & Tobacco
 * Layers"). The on-page H1 keeps the editorial title.
 */

// Lead with the pieces that define an outfit; accessories never make the
// title. Lower number = mentioned first.
const PIECE_RANK: Record<string, number> = {
  suit: 0,
  outerwear: 1,
  blazer: 1,
  dresses: 1,
  knitwear: 2,
  sweater: 2,
  hoodie: 2,
  shirt: 3,
  polo: 3,
  blouse: 3,
  "t-shirt": 4,
  tops: 4,
  "tank top": 4,
  jeans: 5,
  trousers: 5,
  chinos: 5,
  shorts: 5,
  skirt: 5,
  shoes: 6,
};

const STYLE_LABELS: Record<string, string> = {
  minimalism: "minimalist",
  vintage: "vintage",
  casual: "casual",
  streetwear: "streetwear",
  formal: "formal",
  sporty: "sporty",
  preppy: "preppy",
};

// Google shows roughly 60 characters; the root template adds " | Moidello".
const TITLE_MAX = 60;
const DESCRIPTION_MAX = 158;

function pieceLabel(g: string): string {
  if (g === "t-shirt") return "T-shirt";
  if (g === "outerwear") return "jacket";
  if (g === "dresses") return "dress";
  if (g === "tops") return "top";
  return g;
}

/** Defining garments, most important first, as lower-case search terms. */
export function outfitPieces(outfit: Pick<Outfit, "tags">): string[] {
  const seen = new Set<string>();
  for (const t of outfit.tags) {
    const g = canonicalGarment(t.garment ?? "")?.toLowerCase();
    if (g && g in PIECE_RANK) seen.add(g);
  }
  const ordered = Array.from(seen).sort((a, b) => PIECE_RANK[a] - PIECE_RANK[b]);
  // People search in top + bottom pairs ("jacket and jeans outfit"), so
  // pull the first bottom up to second place when a top leads.
  const bottomIdx = ordered.findIndex((g) => PIECE_RANK[g] === 5);
  if (bottomIdx > 1 && PIECE_RANK[ordered[0]] < 5) {
    const [bottom] = ordered.splice(bottomIdx, 1);
    ordered.splice(1, 0, bottom);
  }
  return ordered.map(pieceLabel);
}

function outfitColours(outfit: Pick<Outfit, "tags">): string[] {
  const seen = new Set<string>();
  for (const t of outfit.tags) {
    const c = canonicalColorLabel(t.color ?? "")?.toLowerCase();
    if (c) seen.add(c);
  }
  return Array.from(seen);
}

function joinList(items: string[], last = "&"): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${last} ${items[items.length - 1]}`;
}

function audienceOf(outfit: Pick<Outfit, "gender">): string {
  return outfit.gender === "herr" ? "Men's" : "Women's";
}

function styleOf(outfit: Pick<Outfit, "category">): string | null {
  return STYLE_LABELS[outfit.category?.toLowerCase().trim() ?? ""] ?? null;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : cut.length).replace(/[\s,;:—–-]+$/, "")}…`;
}

export function outfitSeoTitle(outfit: Outfit): string {
  const name = outfit.title.trim();
  if (outfit.vertical === "hem") {
    return HIDE_CREATORS ? name : `${name} by ${outfit.creator.displayName}`;
  }
  const style = styleOf(outfit);
  const phrase = `${audienceOf(outfit)} ${style ? `${capitalise(style)} ` : ""}Outfit`;
  const pieces = outfitPieces(outfit).map(capitalise);

  // Longest variant that fits: three pieces, two, one, then just the phrase.
  for (const n of [3, 2, 1]) {
    if (pieces.length === 0) break;
    const candidate = `${name} — ${phrase} with ${joinList(pieces.slice(0, n))}`;
    if (candidate.length <= TITLE_MAX) return candidate;
  }
  const short = `${name} — ${phrase}`;
  return short.length <= TITLE_MAX ? short : name;
}

export function outfitSeoDescription(outfit: Outfit): string {
  // An admin-set SEO override always wins.
  const meta = outfit.metaDescription?.trim();
  if (meta) return clip(meta, DESCRIPTION_MAX);

  const own = outfit.description?.trim();
  const pieces = outfitPieces(outfit);
  const colours = outfitColours(outfit).slice(0, 3);

  if (outfit.vertical === "hem") {
    return clip(own || `${outfit.title} — interior inspiration on Moidello.`, DESCRIPTION_MAX);
  }

  const style = styleOf(outfit);
  const audience = audienceOf(outfit).toLowerCase();
  const listPart = pieces.length > 0 ? joinList(pieces.slice(0, 4), "and") : "";

  // Editorial description first; top it up with the concrete pieces when
  // it leaves room, so the snippet carries the search terms too.
  if (own) {
    if (own.length < 105 && listPart) {
      return clip(`${own} Featuring ${listPart}, every piece tagged.`, DESCRIPTION_MAX);
    }
    return clip(own, DESCRIPTION_MAX);
  }

  const colourPart = colours.length > 0 ? ` in ${joinList(colours, "and")}` : "";
  const lead = `A ${style ? `${style} ` : ""}${audience} outfit`;
  if (listPart) {
    return clip(
      `${lead} with ${listPart}${colourPart}. See every tagged piece on Moidello.`,
      DESCRIPTION_MAX,
    );
  }
  return clip(`${lead} on Moidello, with every piece tagged.`, DESCRIPTION_MAX);
}
