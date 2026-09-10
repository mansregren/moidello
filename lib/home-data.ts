/**
 * Taxonomy for the "hem" vertical (interior decor). Mirrors the role that
 * lib/data categories + lib/garments play for fashion:
 *
 * - HOME_CATEGORIES   → the per-room category of a post (≈ outfit `category`).
 * - HOME_ITEM_TYPES   → the type of a tagged item in a room (≈ `garment`).
 *
 * Home posts have no gender, so there's no per-gender split here. Stored
 * on the same outfits/tagged_items columns; `vertical = 'hem'` is the only
 * discriminator (see migration 0038).
 */

/** Canonical room taxonomy with URL slugs + SEO descriptions. Drives the
 *  /home/[rum] landing pages (mirror of /stil/[slug]). */
export interface HomeRoom {
  slug: string;
  label: string;
  description: string;
}

export const HOME_ROOMS: HomeRoom[] = [
  {
    slug: "living-room",
    label: "Living room",
    description:
      "Sofas, lighting and textiles that make the living room the heart of the home. See whole rooms and find where every piece of furniture is bought.",
  },
  {
    slug: "bedroom",
    label: "Bedroom",
    description:
      "Bedding, bedside tables and calm. Decor for the bedroom — tag every detail and find the shop.",
  },
  {
    slug: "kitchen",
    label: "Kitchen",
    description:
      "Kitchen decor, tableware and storage. Rooms to take inspiration from, with buy links to everything shown.",
  },
  {
    slug: "dining",
    label: "Dining",
    description:
      "Dining tables, chairs and table settings. Style the dining area and see where the furniture comes from.",
  },
  {
    slug: "bathroom",
    label: "Bathroom",
    description:
      "Bathroom decor, textiles and storage for a calm bathroom with a spa feel.",
  },
  {
    slug: "hallway",
    label: "Hallway",
    description:
      "The first impression — hallway furniture, hooks and mirrors. Decor for the entrance.",
  },
  {
    slug: "home-office",
    label: "Home office",
    description:
      "Desk, chair and lighting for the home office. Focus and form in one room.",
  },
  {
    slug: "outdoor",
    label: "Balcony & patio",
    description:
      "Outdoor furniture, pots and textiles for the balcony and patio. Outside like inside.",
  },
  {
    slug: "wall-art",
    label: "Wall art",
    description:
      "Art, posters and prints that give the walls character. See whole walls and find where every piece is bought.",
  },
];

export function roomBySlug(slug: string): HomeRoom | undefined {
  return HOME_ROOMS.find((r) => r.slug === slug.toLowerCase());
}

export function slugForRoom(label: string): string | undefined {
  return HOME_ROOMS.find((r) => r.label === label)?.slug;
}

/** Per-room categories, shown as the home browse cards + the create-form
 *  category picker. Order is the display order. */
export const HOME_CATEGORIES = [
  "Living room",
  "Bedroom",
  "Kitchen",
  "Dining",
  "Bathroom",
  "Hallway",
  "Home office",
  "Balcony & patio",
  "Wall art",
] as const;

export type HomeCategory = (typeof HOME_CATEGORIES)[number];

/** One-line editorial subtitle per room — used on the browse cards. */
export const HOME_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Living room": "The sofa, the light, the calm",
  Bedroom: "Textiles & rest",
  Kitchen: "The heart of the home",
  Dining: "Set & gathered",
  Bathroom: "A spa every day",
  Hallway: "The first impression",
  "Home office": "Focus & form",
  "Balcony & patio": "Outside like inside",
  "Wall art": "Walls with soul",
};

/** Static fallback cover per room, reusing the existing background pool.
 *  Used until a real home post exists for that category. */
export const HOME_CATEGORY_COVER: Record<string, string> = {
  "Living room": "/images/bg/riviera.webp",
  Bedroom: "/images/bg/parasols.webp",
  Kitchen: "/images/bg/harbor.webp",
  Dining: "/images/bg/boats.webp",
  Bathroom: "/images/bg/positano.webp",
  Hallway: "/images/bg/parasols.webp",
  "Home office": "/images/bg/harbor.webp",
  "Balcony & patio": "/images/bg/boats.webp",
  "Wall art": "/images/bg/positano.webp",
};

/** Item types for the tag editor on home posts (≈ garment types). Stored in
 *  the same tagged_items.garment column. */
export const HOME_ITEM_TYPES = [
  "Sofa",
  "Armchair",
  "Chair",
  "Table",
  "Coffee table",
  "Lighting",
  "Rug",
  "Textiles",
  "Curtains",
  "Bedding",
  "Storage",
  "Shelf",
  "Mirror",
  "Art & prints",
  "Plant",
  "Pot",
  "Decor",
  "Candles & scent",
  "Kitchenware",
  "Tableware",
] as const;

export type HomeItemType = (typeof HOME_ITEM_TYPES)[number];

/**
 * Item-type options for a `<select>`. Like garmentOptions: returns the base
 * list, but prepends an existing value not in the list so editing a legacy
 * tag never silently drops it.
 */
export function homeItemTypeOptions(
  current?: string | null,
): readonly string[] {
  if (current && !HOME_ITEM_TYPES.includes(current as HomeItemType)) {
    return [current, ...HOME_ITEM_TYPES];
  }
  return HOME_ITEM_TYPES;
}
