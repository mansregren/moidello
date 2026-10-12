import sharp from "sharp";
import { isHostnameSafe } from "@/lib/retailers/preview";
import { shortHash } from "@/lib/slug";
import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_EDGE = 1200;

export interface NormalisedImage {
  data: Buffer;
  /** "transparent", a "#rrggbb" studio colour, or null for a busy photo. */
  background: string | null;
}

/**
 * Normalise a product photo for the flatlay builder:
 *  - cap the long edge and trim the uniform studio border so the garment
 *    fills its box,
 *  - detect the studio background colour. The builder paints each
 *    garment's box in that colour, so the photo blends into it; white and
 *    transparent garments simply float on the white canvas. A near-white
 *    background (≥ 236) is lifted to pure white first.
 *  - re-encode as WebP (alpha kept for cut-outs).
 *
 * Automatic background removal was tried and dropped: a flood fill eats
 * the shadows of white garments on light-grey studio backgrounds.
 */
export async function normaliseProductImage(input: Buffer): Promise<NormalisedImage> {
  const resized = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();
  const trimmed = await trimBorder(resized);
  const meta = await sharp(trimmed).metadata();

  let pipeline = sharp(trimmed);
  let background: string | null = "transparent";
  if (!meta.hasAlpha) {
    const bg = await cornerColor(trimmed);
    if (!bg) {
      background = null;
    } else if (bg.every((c) => c >= 236)) {
      pipeline = pipeline.linear(
        bg.map((c) => 255 / c),
        [0, 0, 0],
      );
      background = "#ffffff";
    } else {
      background = `#${bg.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    }
  }

  const data = await pipeline.webp({ quality: 88, alphaQuality: 90 }).toBuffer();
  return { data, background };
}

async function trimBorder(png: Buffer): Promise<Buffer> {
  try {
    const { data, info } = await sharp(png)
      .trim({ threshold: 18 })
      .png()
      .toBuffer({ resolveWithObject: true });
    const meta = await sharp(png).metadata();
    // Only accept the trim when it kept a sane amount of the picture —
    // a near-uniform photo can otherwise collapse to a sliver.
    if (
      info.width > (meta.width ?? 0) * 0.2 &&
      info.height > (meta.height ?? 0) * 0.2
    ) {
      return data;
    }
  } catch {
    // trim throws on fully uniform images — keep the original.
  }
  return png;
}

/** Average colour of the four corners, or null when they disagree. */
async function cornerColor(png: Buffer): Promise<[number, number, number] | null> {
  const { data, info } = await sharp(png)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  const at = (x: number, y: number) => {
    const i = (y * w + x) * ch;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const corners = [at(1, 1), at(w - 2, 1), at(1, h - 2), at(w - 2, h - 2)];
  for (const c of corners) {
    for (let k = 0; k < 3; k++) {
      if (Math.abs(c[k] - corners[0][k]) > 10) return null;
    }
  }
  return [0, 1, 2].map((k) =>
    Math.round(corners.reduce((s, c) => s + c[k], 0) / corners.length),
  ) as [number, number, number];
}

/** Download a remote product image with SSRF + size guards. */
export async function downloadImage(rawUrl: string): Promise<Buffer> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Ogiltig bild-URL.");
  }
  if (!/^https?:$/.test(url.protocol)) throw new Error("Ogiltig bild-URL.");
  // Plenty of shops still emit http:// og:images; most serve https too.
  if (url.protocol === "http:") url.protocol = "https:";
  if (!(await isHostnameSafe(url.hostname))) {
    throw new Error("Bild-URL:en pekar på en otillåten adress.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; Moidello/1.0; +https://moidello.com)",
        accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`Bilden svarade HTTP ${res.status}.`);
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_SOURCE_BYTES) throw new Error("Bilden är för stor.");
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_SOURCE_BYTES) throw new Error("Bilden är för stor.");
    return buf;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Bilden tog för lång tid att hämta.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Normalise + upload a product image to outfits/catalog/. Admin storage
 * policy (0026) allows admins to write anywhere in the bucket.
 */
export async function storeCatalogImage(
  supabase: ServerClient,
  source: Buffer,
): Promise<{ publicUrl: string; path: string; background: string | null }> {
  let processed: NormalisedImage;
  try {
    processed = await normaliseProductImage(source);
  } catch {
    throw new Error("Kunde inte läsa bilden (okänt format).");
  }
  const path = `catalog/${Date.now().toString(36)}-${shortHash()}.webp`;
  const { error } = await supabase.storage
    .from("outfits")
    .upload(path, processed.data, { contentType: "image/webp", upsert: false });
  if (error) throw new Error(`Uppladdning misslyckades: ${error.message}`);
  const {
    data: { publicUrl },
  } = supabase.storage.from("outfits").getPublicUrl(path);
  return { publicUrl, path, background: processed.background };
}
