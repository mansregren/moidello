import type { Retailer, ProductMeta, Locale } from "./types";
import { openGraphFallback } from "./openGraphFallback";

// Nelly uses /<country-code>/<path> for Nordic markets (se/no/dk/fi).
// International is a smaller market — keep the same pattern.
const ID = "nelly";
const SUPPORTED: Locale[] = ["se", "no", "dk", "fi"];

function pathSegment(pathname: string): string | null {
  const m = pathname.match(/^\/([a-z]{2})(\/|$)/i);
  if (!m) return null;
  const code = m[1].toLowerCase();
  return SUPPORTED.includes(code as Locale) ? code : null;
}

function currencyForLocale(locale: Locale | null): string | null {
  if (!locale) return null;
  const map: Record<string, string> = {
    se: "SEK",
    no: "NOK",
    dk: "DKK",
    fi: "EUR",
  };
  return map[locale] ?? null;
}

export const nelly: Retailer = {
  id: ID,
  name: "Nelly",
  domains: ["nelly.com"],
  supportedLocales: SUPPORTED,
  match(url) {
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return host === "nelly.com";
  },
  detectLocale(url) {
    return pathSegment(url.pathname);
  },
  rewriteForLocale(url, target) {
    if (!SUPPORTED.includes(target)) return url;
    const next = new URL(url.toString());
    const current = pathSegment(next.pathname);
    if (current) {
      next.pathname = next.pathname.replace(
        new RegExp(`^/${current}(/|$)`),
        `/${target}$1`,
      );
    } else {
      next.pathname = `/${target}${next.pathname}`;
    }
    return next;
  },
  async extract(html, url) {
    const og = openGraphFallback(html, url);
    const locale = pathSegment(url.pathname);
    const meta: Partial<ProductMeta> = {
      ...og,
      retailer: ID,
      retailer_locale: locale,
      brand: og.brand ?? "Nelly",
    };
    if (!meta.currency) meta.currency = currencyForLocale(locale);
    return meta;
  },
};
