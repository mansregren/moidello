import type { Retailer, ProductMeta, Locale } from "./types";
import { openGraphFallback } from "./openGraphFallback";

const ID = "johnhenric";
const DOMAIN = "johnhenric.com";

// John Henric uses /<locale>/<slug>-<sku> with locale codes that match
// the visitor's country. INT is the international fallback.
const SUPPORTED: Locale[] = ["se", "no", "dk", "fi", "de", "fr", "es", "nl", "int"];

// Detection set is wider than SUPPORTED — we need to RECOGNISE locale
// segments John Henric uses but that we don't rewrite TO (gb/uk/en/eu
// all hit the international/English version). Without this, /gb/foo
// gets prepended with /se/ instead of replaced -> /se/gb/foo, which
// 404s on the retailer. Bug from 2026-05-13 user report.
const DETECTABLE_LOCALES = new Set<string>([
  ...SUPPORTED,
  "gb",
  "uk",
  "en",
  "eu",
]);

function localeFromPath(pathname: string): Locale | null {
  const m = pathname.match(/^\/([a-z]{2,3})(\/|$)/i);
  if (!m) return null;
  const code = m[1].toLowerCase();
  return DETECTABLE_LOCALES.has(code) ? (code as Locale) : null;
}

export const johnhenric: Retailer = {
  id: ID,
  name: "John Henric",
  domains: [DOMAIN],
  supportedLocales: SUPPORTED,
  match(url) {
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return host === DOMAIN;
  },
  detectLocale(url) {
    return localeFromPath(url.pathname);
  },
  rewriteForLocale(url, target) {
    if (!SUPPORTED.includes(target)) return url;
    const current = localeFromPath(url.pathname);
    const next = new URL(url.toString());
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
    const meta: Partial<ProductMeta> = {
      ...openGraphFallback(html, url),
      retailer: ID,
      retailer_locale: localeFromPath(url.pathname),
    };
    // John Henric is always the brand on its own domain — overwrite even
    // if Open Graph picked up something else (e.g. site name).
    meta.brand = "John Henric";
    // Default currency follows the locale when the page hasn't surfaced it
    // via JSON-LD/OG. SE/NO/DK/FI all sell in their own currency.
    if (!meta.currency) {
      const locale = meta.retailer_locale;
      const map: Record<string, string> = {
        se: "SEK",
        no: "NOK",
        dk: "DKK",
        fi: "EUR",
        de: "EUR",
        fr: "EUR",
        es: "EUR",
        nl: "EUR",
      };
      if (locale && map[locale]) meta.currency = map[locale];
    }
    return meta;
  },
};
