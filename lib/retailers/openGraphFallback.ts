/**
 * Generic Open Graph + JSON-LD extractor used when no retailer-specific
 * module matched. Plocks out the basics so admin UI gets *something*
 * filled in for unknown shops.
 */

import * as cheerio from "cheerio";
import type { ProductMeta } from "./types";

interface JsonLdProduct {
  "@type"?: string | string[];
  name?: string;
  brand?: string | { name?: string } | Array<{ name?: string }>;
  image?: string | string[] | { url?: string } | Array<{ url?: string }>;
  color?: string;
  offers?:
    | {
        price?: string | number;
        priceCurrency?: string;
      }
    | Array<{ price?: string | number; priceCurrency?: string }>;
}

function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number") return String(v);
  return null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d.,]/g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickProductFromJsonLd(data: unknown): JsonLdProduct | null {
  if (!data) return null;
  const arr = Array.isArray(data) ? data : [data];
  for (const item of arr) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as JsonLdProduct & { "@graph"?: unknown };
    const type = obj["@type"];
    const types = Array.isArray(type) ? type : [type];
    if (types.includes("Product")) return obj;
    if (obj["@graph"]) {
      const nested = pickProductFromJsonLd(obj["@graph"]);
      if (nested) return nested;
    }
  }
  return null;
}

function flattenBrand(b: JsonLdProduct["brand"]): string | null {
  if (!b) return null;
  if (typeof b === "string") return b;
  if (Array.isArray(b)) {
    const first = b.find((x) => x?.name);
    return first?.name ?? null;
  }
  return b.name ?? null;
}

function flattenImage(i: JsonLdProduct["image"]): string | null {
  if (!i) return null;
  if (typeof i === "string") return i;
  if (Array.isArray(i)) {
    const first = i[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first) return first.url ?? null;
    return null;
  }
  if (typeof i === "object" && "url" in i) return (i as { url?: string }).url ?? null;
  return null;
}

function flattenOffer(o: JsonLdProduct["offers"]):
  | { price: number | null; currency: string | null }
  | null {
  if (!o) return null;
  const first = Array.isArray(o) ? o[0] : o;
  if (!first) return null;
  return {
    price: asNumber(first.price),
    currency: typeof first.priceCurrency === "string" ? first.priceCurrency : null,
  };
}

export function openGraphFallback(
  html: string,
  url: URL,
): Partial<ProductMeta> {
  const $ = cheerio.load(html);
  const out: Partial<ProductMeta> = {};

  // 1. JSON-LD Product is the most reliable. Walk every <script
  // type="application/ld+json"> and look for one with @type=Product.
  $('script[type="application/ld+json"]').each((_, el) => {
    if (out.product_name) return;
    const txt = $(el).contents().text();
    if (!txt) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(txt);
    } catch {
      return;
    }
    const product = pickProductFromJsonLd(parsed);
    if (!product) return;

    out.product_name = asString(product.name) ?? out.product_name;
    out.brand = flattenBrand(product.brand) ?? out.brand;
    out.image_url = flattenImage(product.image) ?? out.image_url;
    out.color = asString(product.color) ?? out.color;
    const offer = flattenOffer(product.offers);
    if (offer) {
      out.price = offer.price ?? out.price;
      out.currency = offer.currency ?? out.currency;
    }
  });

  // 2. Open Graph fallbacks for anything still missing.
  const ogProp = (prop: string): string | null => {
    const v = $(`meta[property="${prop}"]`).attr("content");
    return v?.trim() || null;
  };

  if (!out.product_name) {
    out.product_name = ogProp("og:title") ?? $("title").text().trim() ?? null;
  }
  if (!out.image_url) {
    out.image_url = ogProp("og:image") ?? null;
  }
  if (!out.brand) {
    out.brand =
      ogProp("og:site_name") ??
      ogProp("product:brand") ??
      $('meta[name="brand"]').attr("content") ??
      null;
  }
  if (out.price == null) {
    const amountStr =
      ogProp("product:price:amount") ?? ogProp("og:price:amount");
    if (amountStr) out.price = asNumber(amountStr);
  }
  if (!out.currency) {
    out.currency =
      ogProp("product:price:currency") ?? ogProp("og:price:currency") ?? null;
  }

  // 3. Normalise the image to an absolute URL if it came back relative.
  if (out.image_url && !/^https?:\/\//i.test(out.image_url)) {
    try {
      out.image_url = new URL(out.image_url, url).toString();
    } catch {
      out.image_url = null;
    }
  }

  // 4. Brand is sometimes 'Site Name | Product Name' on smaller shops —
  // strip a trailing pipe-suffix so we don't leak it as a brand name.
  if (out.brand && out.brand.includes("|")) {
    out.brand = out.brand.split("|")[0].trim();
  }

  return out;
}
