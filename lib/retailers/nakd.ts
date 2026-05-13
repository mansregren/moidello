import type { Retailer, ProductMeta, Locale } from "./types";
import { openGraphFallback } from "./openGraphFallback";

// NA-KD uses /<lang-or-country>/<path>. Locale codes vary — they expose
// both language segments (en, sv) and country variants (no, dk, fi). We
// surface country codes; language-only segments don't carry currency info.
const ID = "nakd";
const LOCALE_TO_SEGMENT: Record<Locale, string> = {
  se: "sv",
  no: "no",
  dk: "dk",
  fi: "fi",
  de: "de",
  fr: "fr",
  nl: "nl",
  it: "it",
  es: "es",
  pl: "pl",
  gb: "en-gb",
  us: "en",
};
const SEGMENT_TO_LOCALE: Record<string, Locale> = Object.fromEntries(
  Object.entries(LOCALE_TO_SEGMENT).map(([k, v]) => [v, k as Locale]),
);
const SUPPORTED = Object.keys(LOCALE_TO_SEGMENT) as Locale[];

function pathSegment(pathname: string): string | null {
  // Match either 2-letter (sv/no/dk/...) or "en-gb" style.
  const m = pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(\/|$)/i);
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
    it: "EUR",
    es: "EUR",
    pl: "PLN",
    gb: "GBP",
    us: "USD",
  };
  return map[locale] ?? null;
}

export const nakd: Retailer = {
  id: ID,
  name: "NA-KD",
  domains: ["na-kd.com"],
  supportedLocales: SUPPORTED,
  match(url) {
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return host === "na-kd.com";
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
      brand: "NA-KD",
    };
    if (!meta.currency) meta.currency = currencyForLocale(locale);
    return meta;
  },
};
