import type { Retailer, ProductMeta, Locale } from "./types";
import { openGraphFallback } from "./openGraphFallback";

// H&M uses /<lang>_<country>/<path> where the locale segment combines a
// language and ISO country code (e.g. sv_se, en_us, da_dk).
const ID = "hm";
const LOCALE_TO_SEGMENT: Record<Locale, string> = {
  se: "sv_se",
  no: "no_no",
  dk: "da_dk",
  fi: "fi_fi",
  de: "de_de",
  fr: "fr_fr",
  nl: "nl_nl",
  be: "fr_be",
  it: "it_it",
  es: "es_es",
  at: "de_at",
  ch: "de_ch",
  gb: "en_gb",
  ie: "en_ie",
  pl: "pl_pl",
  cz: "cs_cz",
  us: "en_us",
};
const SEGMENT_TO_LOCALE: Record<string, Locale> = Object.fromEntries(
  Object.entries(LOCALE_TO_SEGMENT).map(([k, v]) => [v, k as Locale]),
);
const SUPPORTED = Object.keys(LOCALE_TO_SEGMENT) as Locale[];

function pathSegment(pathname: string): string | null {
  const m = pathname.match(/^\/([a-z]{2}_[a-z]{2})(\/|$)/i);
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
    pl: "PLN",
    cz: "CZK",
    us: "USD",
  };
  return map[locale] ?? null;
}

export const hm: Retailer = {
  id: ID,
  name: "H&M",
  domains: ["hm.com", "www2.hm.com"],
  supportedLocales: SUPPORTED,
  match(url) {
    const host = url.hostname.replace(/^www2?\./, "").toLowerCase();
    return host === "hm.com";
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
      brand: "H&M",
    };
    if (!meta.currency) meta.currency = currencyForLocale(locale);
    return meta;
  },
};
