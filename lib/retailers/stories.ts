import type { Retailer, ProductMeta, Locale } from "./types";
import { openGraphFallback } from "./openGraphFallback";

const ID = "stories";
const DOMAIN = "stories.com";

// & Other Stories uses /<locale>/<rest> with locale codes that look like
// 'en_sek', 'en_eur', etc. We surface the simpler currency-derivative as
// the visible locale.
const LOCALE_TO_PATH: Record<Locale, string> = {
  se: "en_sek",
  dk: "en_dkk",
  no: "en_nok",
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
  us: "en_usd",
};
const PATH_TO_LOCALE: Record<string, Locale> = Object.fromEntries(
  Object.entries(LOCALE_TO_PATH).map(([k, v]) => [v, k as Locale]),
);
const SUPPORTED = Object.keys(LOCALE_TO_PATH) as Locale[];

function pathSegment(pathname: string): string | null {
  const m = pathname.match(/^\/([a-z]{2}_[a-z]{3})(\/|$)/i);
  return m?.[1]?.toLowerCase() ?? null;
}

function currencyForLocale(locale: Locale | null): string | null {
  if (!locale) return null;
  const seg = LOCALE_TO_PATH[locale];
  if (!seg) return null;
  return seg.split("_")[1].toUpperCase();
}

export const stories: Retailer = {
  id: ID,
  name: "& Other Stories",
  domains: [DOMAIN],
  supportedLocales: SUPPORTED,
  match(url) {
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return host === DOMAIN;
  },
  detectLocale(url) {
    const seg = pathSegment(url.pathname);
    if (!seg) return null;
    return PATH_TO_LOCALE[seg] ?? null;
  },
  rewriteForLocale(url, target) {
    const seg = LOCALE_TO_PATH[target];
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
    const locale = seg ? (PATH_TO_LOCALE[seg] ?? null) : null;
    const meta: Partial<ProductMeta> = {
      ...og,
      retailer: ID,
      retailer_locale: locale,
      brand: "& Other Stories",
    };
    if (!meta.currency) meta.currency = currencyForLocale(locale);
    return meta;
  },
};
