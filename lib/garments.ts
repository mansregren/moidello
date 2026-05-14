/**
 * Garment-type options for the tag editors (/skapa, admin outfit editor).
 * Split by gender — a herr outfit shouldn't offer Klänningar/Kjol, a dam
 * outfit shouldn't be missing them. The original coarse names (Toppar,
 * Klänningar, Väskor, …) are kept so already-tagged items still match.
 */
export const GARMENTS_DAM = [
  "T-shirt",
  "Linne",
  "Toppar",
  "Skjorta",
  "Blus",
  "Piké",
  "Tröja",
  "Stickat",
  "Huvtröja",
  "Kavaj",
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

export const GARMENTS_HERR = [
  "T-shirt",
  "Linne",
  "Skjorta",
  "Piké",
  "Tröja",
  "Stickat",
  "Huvtröja",
  "Kavaj",
  "Jeans",
  "Byxor",
  "Chinos",
  "Shorts",
  "Ytterkläder",
  "Kostym",
  "Skor",
  "Väskor",
  "Accessoarer",
  "Klocka",
  "Smycken",
] as const;

/** Union of both — used by the discover filter, which must cover every
 *  value that could be stored on a tagged_item regardless of gender. */
export const GARMENTS = Array.from(
  new Set<string>([...GARMENTS_DAM, ...GARMENTS_HERR]),
);

export type Gender = "dam" | "herr";

/** The garment list for a given gender. */
export function garmentsForGender(gender: Gender): readonly string[] {
  return gender === "herr" ? GARMENTS_HERR : GARMENTS_DAM;
}

/**
 * Garment options for a `<select>`. Returns the gendered list, but if the
 * tag already has a value not in that list (legacy data, or a value from
 * the other gender), prepend it so the select still shows it and editing
 * the rest of the tag doesn't silently drop it.
 */
export function garmentOptions(
  gender: Gender,
  current?: string | null,
): readonly string[] {
  const base = garmentsForGender(gender);
  if (current && !base.includes(current)) return [current, ...base];
  return base;
}
