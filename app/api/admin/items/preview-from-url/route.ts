// POST /api/admin/items/preview-from-url
//
// Admin-only. Tar en produkt-URL och returnerar struktur:erad ProductMeta
// (brand, namn, pris, valuta, färg, bild, retailer-id, locale, affiliate-
// info). 24h LRU-cache in-memory. Fail-soft — saknad data ⇒ null fält,
// inte HTTP-fel.

import { NextResponse } from "next/server";
import { LRUCache } from "lru-cache";
import { isCurrentUserAdmin } from "@/lib/admin";
import { findRetailer, openGraphFallback } from "@/lib/retailers";
import type { ProductMeta } from "@/lib/retailers";
import { detectAffiliate } from "@/lib/affiliate/detect";

interface PreviewResult extends ProductMeta {
  is_affiliate: boolean;
  affiliate_network: string | null;
  _raw?: unknown;
}

const cache = new LRUCache<string, PreviewResult>({
  max: 500,
  ttl: 1000 * 60 * 60 * 24, // 24h
});

const USER_AGENT =
  "Mozilla/5.0 (compatible; Moidello/1.0; +https://moidello.com)";
const FETCH_TIMEOUT_MS = 5000;

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "sv-SE,sv;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.toLowerCase().includes("html")) return null;
    const text = await res.text();
    // Cap text size at 1.5MB to avoid OOM on bloated pages.
    return text.length > 1_500_000 ? text.slice(0, 1_500_000) : text;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Inte behörig." }, { status: 403 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON." }, { status: 400 });
  }

  const raw = typeof body.url === "string" ? body.url.trim() : "";
  if (!raw) {
    return NextResponse.json({ error: "Saknar url." }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(raw);
    if (!/^https?:$/i.test(url.protocol)) throw new Error();
  } catch {
    return NextResponse.json(
      { error: "Ogiltig URL — måste börja med http(s)." },
      { status: 400 },
    );
  }

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  const affiliate = detectAffiliate(url);
  const retailer = findRetailer(url);

  // Affiliate-redirector-länkar (LTK/ShopMy/etc.) servar oftast inte
  // produkt-metadata på sin egen domän — vi skulle ändå pass-through:a
  // länken. Hoppa over HTML-fetch och returnera bara affiliate-flaggan.
  if (affiliate.isAffiliate && !retailer) {
    const result: PreviewResult = {
      brand: null,
      product_name: null,
      price: null,
      currency: null,
      color: null,
      image_url: null,
      retailer: null,
      retailer_locale: null,
      is_affiliate: true,
      affiliate_network: affiliate.network,
    };
    cache.set(cacheKey, result);
    return NextResponse.json(result);
  }

  const html = await fetchHtml(url.toString());
  let meta: Partial<ProductMeta> = {};

  if (html) {
    try {
      meta = retailer
        ? await retailer.extract(html, url)
        : { ...openGraphFallback(html, url), retailer: null };
    } catch {
      meta = {};
    }
  }

  const result: PreviewResult = {
    brand: meta.brand ?? null,
    product_name: meta.product_name ?? null,
    price: meta.price ?? null,
    currency: meta.currency ?? null,
    color: meta.color ?? null,
    image_url: meta.image_url ?? null,
    retailer: meta.retailer ?? retailer?.id ?? null,
    retailer_locale:
      meta.retailer_locale ?? retailer?.detectLocale(url) ?? null,
    is_affiliate: affiliate.isAffiliate,
    affiliate_network: affiliate.network,
    _raw: meta,
  };

  cache.set(cacheKey, result);
  return NextResponse.json(result);
}
