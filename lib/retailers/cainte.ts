import type { Retailer, ProductMeta, Locale } from "./types";
import { openGraphFallback } from "./openGraphFallback";

// Cainte (Shopify Markets) uses /<lang-country>/<path>. Verified by
// probing live product URLs 2026-09-11 — most markets are English-only
// (en-<country>), but DE and FR have localized variants (de-de, fr-fr).
// en-us and en-fi 404 (not served markets); be has no working variant at
// all despite showing in the client-side country/currency picker.
const ID = "cainte";
const LOCALE_TO_SEGMENT: Record<Locale, string> = {
  se: "en-se",
  de: "de-de",
  at: "en-at",
  ch: "en-ch",
  fr: "fr-fr",
  nl: "en-nl",
  it: "en-it",
  es: "en-es",
  pl: "en-pl",
  ie: "en-ie",
  gb: "en-gb",
  dk: "en-dk",
  no: "en-no",
};
const SEGMENT_TO_LOCALE: Record<string, Locale> = Object.fromEntries(
  Object.entries(LOCALE_TO_SEGMENT).map(([k, v]) => [v, k as Locale]),
);
const SUPPORTED = Object.keys(LOCALE_TO_SEGMENT) as Locale[];

function pathSegment(pathname: string): string | null {
  const m = pathname.match(/^\/([a-z]{2}-[a-z]{2})(\/|$)/i);
  return m?.[1]?.toLowerCase() ?? null;
}

function currencyForLocale(locale: Locale | null): string | null {
  if (!locale) return null;
  const map: Record<string, string> = {
    se: "SEK",
    de: "EUR",
    at: "EUR",
    ch: "CHF",
    fr: "EUR",
    nl: "EUR",
    it: "EUR",
    es: "EUR",
    pl: "PLN",
    ie: "EUR",
    gb: "GBP",
    dk: "DKK",
    no: "NOK",
  };
  return map[locale] ?? null;
}

export const cainte: Retailer = {
  id: ID,
  name: "Cainte",
  domains: ["cainte.com"],
  supportedLocales: SUPPORTED,
  match(url) {
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return host === "cainte.com";
  },
  detectLocale(url) {
    const seg = pathSegment(url.pathname);
    if (!seg) return null;
    return SEGMENT_TO_LOCALE[seg] ?? null;
  },
  rewriteForLocale(url, target) {
    const seg = LOCALE_TO_SEGMENT[target];
    if (!seg) return url;
    const next = new URL(url.toString());
    const current = pathSegment(next.pathname);
    if (current) {
      next.pathname = next.pathname.replace(
        new RegExp(`^/${current}(/|$)`),
        `/${seg}$1`,
      );
    } else {
      next.pathname = `/${seg}${next.pathname}`;
    }
    return next;
  },
  async extract(html, url) {
    const og = openGraphFallback(html, url);
    const seg = pathSegment(url.pathname);
    const locale = seg ? (SEGMENT_TO_LOCALE[seg] ?? null) : null;
    const meta: Partial<ProductMeta> = {
      ...og,
      retailer: ID,
      retailer_locale: locale,
      brand: "Cainte",
    };
    if (!meta.currency) meta.currency = currencyForLocale(locale);
    return meta;
  },
};
