/**
 * Common garment colours, shown as clickable swatches in the tag
 * editors (/skapa and the admin outfit editor) instead of a free-text
 * field. The stored value is the Swedish `name` — keeps `tagged_items.color`
 * a plain string and consistent across both surfaces.
 */
// Single-word names only: /farg/[slug] reconstructs the colour name by
// capitalising the slug, so a space would break the round-trip. Existing
// names + order are preserved (stored values must keep matching) — new
// colours are appended.
export const GARMENT_COLORS = [
  // Neutraler
  { name: "Svart", hex: "#1c1c1e" },
  { name: "Antracit", hex: "#3a3d42" },
  { name: "Grå", hex: "#9ca3af" },
  { name: "Silver", hex: "#c4c7cc" },
  { name: "Vit", hex: "#f4f4ee" },
  { name: "Krämvit", hex: "#efe7d3" },
  { name: "Beige", hex: "#d8c9a8" },
  { name: "Kamel", hex: "#c19a6b" },
  { name: "Brun", hex: "#6e4f37" },
  { name: "Khaki", hex: "#8a865d" },
  // Blått
  { name: "Marinblå", hex: "#232f45" },
  { name: "Blå", hex: "#3f6fb0" },
  { name: "Ljusblå", hex: "#9cc4e8" },
  { name: "Denim", hex: "#5a7494" },
  { name: "Petrol", hex: "#1f4e54" },
  { name: "Turkos", hex: "#2fa6a0" },
  // Grönt
  { name: "Mörkgrön", hex: "#2f4733" },
  { name: "Grön", hex: "#4f7355" },
  { name: "Olivgrön", hex: "#5b6236" },
  { name: "Mintgrön", hex: "#b8e0c9" },
  // Varmt
  { name: "Vinröd", hex: "#5e1f2a" },
  { name: "Röd", hex: "#b1322b" },
  { name: "Korall", hex: "#f08060" },
  { name: "Terrakotta", hex: "#b5603f" },
  { name: "Orange", hex: "#d8763f" },
  { name: "Senapsgul", hex: "#c99a2e" },
  { name: "Gul", hex: "#e3c44d" },
  // Rosa & lila
  { name: "Rosa", hex: "#e8aec2" },
  { name: "Magenta", hex: "#b03070" },
  { name: "Lila", hex: "#7a6298" },
  { name: "Ljuslila", hex: "#c3b1d6" },
] as const;

export type GarmentColor = (typeof GARMENT_COLORS)[number]["name"];
