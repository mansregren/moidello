import { cookies } from "next/headers";

/**
 * The 7 original seed images. Used both for hero placements and ambient
 * rotation. anna/eirik/jerzy/nikola live in /public but are intentionally
 * not in this pool — drop them in here later if you want them back.
 */
export const HERO_POOL = [
  "/images/bg/positano.webp",
  "/images/bg/parasols.webp",
  "/images/bg/harbor.webp",
  "/images/bg/ocean.webp",
  "/images/bg/riviera.webp",
  "/images/bg/boats.webp",
  "/images/bg/cafe.webp",
] as const;

export const BG_POOL = HERO_POOL;

const FALLBACK = HERO_POOL[0];

/**
 * Tiny string hash (djb2 variant) — gives us a stable integer from a
 * seed + slot pair without pulling crypto in.
 */
function hash(seed: number, slot: string): number {
  let h = 5381 + seed;
  for (let i = 0; i < slot.length; i++) {
    h = (h * 33 + slot.charCodeAt(i)) | 0;
  }
  return h < 0 ? -h : h;
}

/**
 * Returns the bg image for a given slot, stable within a session.
 *
 * Slot ids let us pick *different* images for different positions on the
 * same page (hero vs lifestyle banner) while keeping both stable across
 * navigations. Pass `pool` to restrict to a subset; default is everything.
 */
export async function pickBg(
  slot: string,
  pool: readonly string[] = BG_POOL,
): Promise<string> {
  if (pool.length === 0) return FALLBACK;
  const jar = await cookies();
  const seedRaw = jar.get("moidello_bg_seed")?.value;
  const seed = seedRaw ? Number.parseInt(seedRaw, 10) : 0;
  if (!Number.isFinite(seed)) return pool[0];
  const i = hash(seed, slot) % pool.length;
  return pool[i];
}

/**
 * Pick N distinct images for a list of slots. Useful when you have several
 * sections on the same page that should all be different from each other.
 */
export async function pickBgs(
  slots: string[],
  pool: readonly string[] = BG_POOL,
): Promise<string[]> {
  const jar = await cookies();
  const seedRaw = jar.get("moidello_bg_seed")?.value;
  const seed = seedRaw ? Number.parseInt(seedRaw, 10) : 0;
  if (!Number.isFinite(seed) || pool.length === 0) {
    return slots.map(() => FALLBACK);
  }

  const taken = new Set<number>();
  return slots.map((slot) => {
    let idx = hash(seed, slot) % pool.length;
    let attempts = 0;
    while (taken.has(idx) && attempts < pool.length) {
      idx = (idx + 1) % pool.length;
      attempts++;
    }
    taken.add(idx);
    return pool[idx];
  });
}
