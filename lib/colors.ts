/**
 * Common garment colours, shown as clickable swatches in the tag
 * editors (/skapa and the admin outfit editor) instead of a free-text
 * field. The stored value is the Swedish `name` — keeps `tagged_items.color`
 * a plain string and consistent across both surfaces.
 */
export const GARMENT_COLORS = [
  { name: "Svart", hex: "#1c1c1e" },
  { name: "Vit", hex: "#f4f4ee" },
  { name: "Grå", hex: "#9ca3af" },
  { name: "Beige", hex: "#d8c9a8" },
  { name: "Brun", hex: "#6e4f37" },
  { name: "Marinblå", hex: "#232f45" },
  { name: "Blå", hex: "#3f6fb0" },
  { name: "Ljusblå", hex: "#9cc4e8" },
  { name: "Grön", hex: "#4f7355" },
  { name: "Khaki", hex: "#8a865d" },
  { name: "Röd", hex: "#b1322b" },
  { name: "Rosa", hex: "#e8aec2" },
  { name: "Lila", hex: "#7a6298" },
  { name: "Gul", hex: "#e3c44d" },
  { name: "Orange", hex: "#d8763f" },
] as const;

export type GarmentColor = (typeof GARMENT_COLORS)[number]["name"];
