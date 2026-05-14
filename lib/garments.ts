/**
 * Single source of truth for clothing-type options. Used by the create
 * flow (/skapa), the admin tag editors, and the discover filter — so a
 * garment picked on one surface is filterable on every other.
 *
 * The original seven coarse buckets are kept (Toppar, Byxor, Skor,
 * Accessoarer, Ytterkläder, Klänningar, Väskor) so already-tagged items
 * keep matching the discover filter; the rest are the common specifics
 * users actually reach for.
 */
export const GARMENTS = [
  "T-shirt",
  "Toppar",
  "Skjorta",
  "Tröja",
  "Stickat",
  "Huvtröja",
  "Klänningar",
  "Kjol",
  "Jeans",
  "Byxor",
  "Shorts",
  "Ytterkläder",
  "Kostym",
  "Skor",
  "Väskor",
  "Accessoarer",
  "Smycken",
] as const;

export type Garment = (typeof GARMENTS)[number];
