import type { Retailer, ProductMeta, Locale } from "./types";
import { openGraphFallback } from "./openGraphFallback";

// ARKET (like COS / & Other Stories — same H&M Group platform) uses
// /en_<country>/<path> with English as the only language. Currency code
// is encoded in the segment (sek/dkk/eur/etc).
const ID = "arket";
const LOCALE_TO_SEGMENT: Record<Locale, string> = {
  se: "en_sek",
  no: "en_nok",
  dk: "en_dkk",
  fi: "en_eur",
  de: "en_eur",
  fr: "en_eur",
  nl: "en_eur",
  be: "en_eur",
  it: "en_eur",
  es: "en_eur",
  at: "en_eur",
  ch: "en_chf",
  gb: "en_gbp",
  ie: "en_eur",
  us: "en_usd",
};
const SEGMENT_TO_LOCALE: Record<string, Locale> = Object.fromEntries(
  Object.entries(LOCALE_TO_SEGMENT).map(([k, v]) => [v, k as Locale]),
);
const SUPPORTED = Object.keys(LOCALE_TO_SEGMENT) as Locale[];

function pathSegment(pathname: string): string | null {
  const m = pathname.match(/^\/(en_[a-z]{3})(\/|$)/i);
  return m?.[1]?.toLowerCase() ?? null;
}

function currencyForLocale(locale: Locale | null): string | null {
  if (!locale) return null;
  const seg = LOCALE_TO_SEGMENT[locale];
  if (!seg) return null;
  return seg.split("_")[1].toUpperCase();
}

export const arket: Retailer = {
  id: ID,
  name: "ARKET",
  domains: ["arket.com"],
  supportedLocales: SUPPORTED,
  match(url) {
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return host === "arket.com";
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
      brand: "ARKET",
    };
    if (!meta.currency) meta.currency = currencyForLocale(locale);
    return meta;
  },
};
