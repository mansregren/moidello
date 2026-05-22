/** ISO 3166-1 alpha-2 country code (e.g. "SE", "NO", "DK"). */
export type Region = string;

export type AccountType = "creator" | "brand";

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  outfitCount: number;
  coverImage?: string;
  /** User's primary market — used to default-suggest store links per region. */
  region?: Region;
  accountType?: AccountType;
  brandName?: string;
  brandWebsite?: string;
  /** Optional public links — empty/undefined means hidden. */
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
  contactEmail?: string;
}

export type GarmentType =
  | "Toppar"
  | "Byxor"
  | "Skor"
  | "Accessoarer"
  | "Ytterkläder"
  | "Klänningar"
  | "Väskor";

export interface TaggedItem {
  id: string;
  brand: string;
  name: string;
  price: number;
  currency: string;
  /** Default buy URL (Phase 1). When per-region links arrive, prefer buyUrls. */
  buyUrl: string;
  /** Per-region buy URLs. ISO country codes as keys (e.g. { SE: "...", NO: "..." }). */
  buyUrls?: Record<Region, string>;
  /**
   * Whether the link is an affiliate link. When true, the UI must display a
   * "Reklam" disclosure per Marknadsföringslagen / Konsumentverkets riktlinjer.
   */
  isAffiliate?: boolean;
  garment: GarmentType;
  /** Position on image as percentage (0-100) */
  x: number;
  y: number;
  /** AI-generated long-form description (migration 0036). */
  description?: string | null;
  /** AI-generated SEO keywords. */
  keywords?: string[];
  /** AI-generated alt-text for the product image. */
  altText?: string | null;
  /** Material (linne, ull, denim, …). */
  material?: string | null;
  /** Color (beige, svart, …). */
  color?: string | null;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  createdAt: string;
  likes: number;
}

export type Gender = "herr" | "dam";

export type GenderFilter = Gender;

/**
 * Content vertical. "mode" = fashion (the original product, filtered by
 * herr/dam). "hem" = home/interior decor (no gender). The two share the
 * same outfits + tagged_items + engagement stack; `vertical` is the only
 * discriminator. Mode feeds scope to "mode"; /home scopes to "hem".
 */
export type Vertical = "mode" | "hem";

export interface Outfit {
  id: string;
  /** URL-friendly slug, unique per creator. Combined with creator.username
   *  forms the canonical /<username>/<slug> path. May be empty for
   *  legacy/mock outfits. */
  slug?: string;
  image: string;
  /** "photo" = person wearing outfit, "flatlay" = clothes laid out */
  type: "photo" | "flatlay";
  /** Which vertical this post belongs to. Absent/undefined means "mode"
   *  (all legacy rows + mock fixtures); rowToOutfit always sets it
   *  explicitly. Home posts are "hem". */
  vertical?: Vertical;
  /** herr/dam for fashion. Home posts have no gender; rowToOutfit fills a
   *  harmless "dam" fallback so mode-only code stays non-nullable — never
   *  read `gender` in home flows. */
  gender: Gender;
  /** Short human-readable reference code, e.g. "A271" (1 letter + 3
   *  digits). DB-assigned per outfit; absent on mock fixtures. */
  code?: string;
  title: string;
  description: string;
  /** Optional admin-set SEO override. When present it takes priority
   *  over `description` for the Google snippet (see buildDescription
   *  in the outfit layouts). Creators on /skapa only fill in
   *  `description`; this is an admin-editor power-tool field. */
  metaDescription?: string;
  creator: User;
  tags: TaggedItem[];
  likes: number;
  saves: number;
  comments: Comment[];
  category: string;
  createdAt: string;
  /** Owner has hidden the post — gone from public feeds but visible to
   *  the owner so they can re-publish. */
  isHidden?: boolean;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  description: string;
  website: string;
  tier: "luxury" | "premium" | "contemporary" | "high-street";
}

export type Category =
  | "Streetwear"
  | "Minimalism"
  | "Vintage"
  | "Casual"
  | "Formal"
  | "Sporty"
  | "Preppy";
