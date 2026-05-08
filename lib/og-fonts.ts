/**
 * Loads Anton (heading) and Inter (body) TTFs for use inside Next.js
 * ImageResponse routes. Satori needs raw TTF buffers — Google's CSS
 * endpoint serves WOFF2 to modern UAs, so we hit the Google Fonts repo
 * on GitHub which always serves TTF.
 */

const ANTON_URL =
  "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf";
const INTER_REGULAR_URL =
  "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf";

let antonCache: ArrayBuffer | null = null;
let interCache: ArrayBuffer | null = null;

async function fetchTtf(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load font ${url}: ${res.status}`);
  return res.arrayBuffer();
}

export async function loadAnton(): Promise<ArrayBuffer> {
  if (antonCache) return antonCache;
  antonCache = await fetchTtf(ANTON_URL);
  return antonCache;
}

export async function loadInter(): Promise<ArrayBuffer> {
  if (interCache) return interCache;
  interCache = await fetchTtf(INTER_REGULAR_URL);
  return interCache;
}
