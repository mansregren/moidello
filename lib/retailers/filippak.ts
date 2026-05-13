import type { Retailer, ProductMeta, Locale } from "./types";
import { openGraphFallback } from "./openGraphFallback";

// Filippa K uses /<lang-country>/<path> with hyphen-separated locale codes
// (sv-se, en-us, de-de, etc).
const ID = "filippak";
const LOCALE_TO_SEGMENT: Record<Locale, string> = {
  se: "sv-se",
  no: "en-no",
  dk: "en-dk",
  fi: "en-fi",
  de: "de-de",
  fr: "en-fr",
  nl: "en-nl",
  be: "en-be",
  it: "en-it",
  es: "en-es",
  at: "de-at",
  ch: "de-ch",
  gb: "en-gb",
  ie: "en-ie",
  us: "en-us",
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
    no: "NOK",
    dk: "DKK",
    fi: "EUR",
    de: "EUR",
    fr: "EUR",
    nl: "EUR",
    be: "EUR",
    it: "EUR",
    es: "EUR",
    at: "EUR",
    ch: "CHF",
    gb: "GBP",
    ie: "EUR",
    us: "USD",
  };
  return map[locale] ?? null;
}

export const filippak: Retailer = {
  id: ID,
  name: "Filippa K",
  domains: ["filippa-k.com"],
  supportedLocales: SUPPORTED,
  match(url) {
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return host === "filippa-k.com";
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
      brand: "Filippa K",
    };
    if (!meta.currency) meta.currency = currencyForLocale(locale);
    return meta;
  },
};
