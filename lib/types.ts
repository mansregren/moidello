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

export interface Outfit {
  id: string;
  image: string;
  /** "photo" = person wearing outfit, "flatlay" = clothes laid out */
  type: "photo" | "flatlay";
  gender: Gender;
  title: string;
  description: string;
  creator: User;
  tags: TaggedItem[];
  likes: number;
  saves: number;
  comments: Comment[];
  category: string;
  createdAt: string;
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
  | "Bohemian"
  | "Preppy";
