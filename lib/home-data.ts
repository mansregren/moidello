/**
 * Taxonomy for the "hem" vertical (heminredning / interior decor). Mirrors
 * the role that lib/data categories + lib/garments play for fashion:
 *
 * - HOME_CATEGORIES   → the per-room category of a post (≈ outfit `category`).
 * - HOME_ITEM_TYPES   → the type of a tagged item in a room (≈ `garment`).
 *
 * Home posts have no gender, so there's no per-gender split here. Stored
 * on the same outfits/tagged_items columns; `vertical = 'hem'` is the only
 * discriminator (see migration 0038).
 */

/** Per-room categories, shown as the home browse cards + the create-form
 *  category picker. Order is the display order. */
export const HOME_CATEGORIES = [
  "Vardagsrum",
  "Sovrum",
  "Kök",
  "Matplats",
  "Badrum",
  "Hall",
  "Arbetsrum",
  "Barnrum",
  "Balkong & uteplats",
  "Förvaring",
] as const;

export type HomeCategory = (typeof HOME_CATEGORIES)[number];

/** One-line editorial subtitle per room — used on the browse cards. */
export const HOME_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Vardagsrum: "Soffan, ljuset, lugnet",
  Sovrum: "Textil & ro",
  Kök: "Hjärtat i hemmet",
  Matplats: "Dukat & samlat",
  Badrum: "Spa varje dag",
  Hall: "Första intrycket",
  Arbetsrum: "Fokus & form",
  Barnrum: "Lek med stil",
  "Balkong & uteplats": "Ute som inne",
  Förvaring: "Ordning som syns",
};

/** Static fallback cover per room, reusing the existing background pool.
 *  Used until a real home post exists for that category. */
export const HOME_CATEGORY_COVER: Record<string, string> = {
  Vardagsrum: "/images/bg/riviera.webp",
  Sovrum: "/images/bg/parasols.webp",
  Kök: "/images/bg/harbor.webp",
  Matplats: "/images/bg/boats.webp",
  Badrum: "/images/bg/positano.webp",
  Hall: "/images/bg/parasols.webp",
  Arbetsrum: "/images/bg/harbor.webp",
  Barnrum: "/images/bg/riviera.webp",
  "Balkong & uteplats": "/images/bg/boats.webp",
  Förvaring: "/images/bg/positano.webp",
};

/** Item types for the tag editor on home posts (≈ garment types). Stored in
 *  the same tagged_items.garment column. */
export const HOME_ITEM_TYPES = [
  "Soffa",
  "Fåtölj",
  "Stol",
  "Bord",
  "Soffbord",
  "Belysning",
  "Matta",
  "Textil",
  "Gardiner",
  "Sängkläder",
  "Förvaring",
  "Hylla",
  "Spegel",
  "Konst & tavlor",
  "Växt",
  "Kruka",
  "Dekoration",
  "Ljus & doft",
  "Köksutrustning",
  "Servis",
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
