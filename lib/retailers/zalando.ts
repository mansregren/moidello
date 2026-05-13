import type { Retailer, ProductMeta, Locale } from "./types";
import { openGraphFallback } from "./openGraphFallback";

const ID = "zalando";

// Zalando uses country-TLDs (zalando.se, zalando.dk, zalando.de)
// instead of /<locale>/. Their domains list is comprehensive.
const COUNTRY_TLDS: Record<string, Locale> = {
  "zalando.se": "se",
  "zalando.dk": "dk",
  "zalando.no": "no",
  "zalando.fi": "fi",
  "zalando.de": "de",
  "zalando.nl": "nl",
  "zalando.be": "be",
  "zalando.fr": "fr",
  "zalando.pl": "pl",
  "zalando.it": "it",
  "zalando.es": "es",
  "zalando.at": "at",
  "zalando.ch": "ch",
  "zalando.co.uk": "gb",
  "zalando.ie": "ie",
  "zalando.cz": "cz",
  "zalando.sk": "sk",
};

const SUPPORTED: Locale[] = Array.from(new Set(Object.values(COUNTRY_TLDS)));

function tldFor(locale: Locale): string | null {
  const entry = Object.entries(COUNTRY_TLDS).find(([, l]) => l === locale);
  return entry?.[0] ?? null;
}

function currencyForLocale(locale: Locale | null): string | null {
  if (!locale) return null;
  const map: Record<string, string> = {
    se: "SEK",
    dk: "DKK",
    no: "NOK",
    fi: "EUR",
    de: "EUR",
    nl: "EUR",
    be: "EUR",
    fr: "EUR",
    pl: "PLN",
    it: "EUR",
    es: "EUR",
    at: "EUR",
    ch: "CHF",
    gb: "GBP",
    ie: "EUR",
    cz: "CZK",
    sk: "EUR",
  };
  return map[locale] ?? null;
}

export const zalando: Retailer = {
  id: ID,
  name: "Zalando",
  domains: Object.keys(COUNTRY_TLDS),
  supportedLocales: SUPPORTED,
  match(url) {
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return host in COUNTRY_TLDS;
  },
  detectLocale(url) {
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return COUNTRY_TLDS[host] ?? null;
  },
  rewriteForLocale(url, target) {
    const tld = tldFor(target);
    if (!tld) return url;
    const next = new URL(url.toString());
    next.hostname = tld;
    return next;
  },
  async extract(html, url) {
    const og = openGraphFallback(html, url);
    const locale = COUNTRY_TLDS[url.hostname.replace(/^www\./, "").toLowerCase()] ?? null;
    const meta: Partial<ProductMeta> = {
      ...og,
      retailer: ID,
      retailer_locale: locale,
    };
    if (!meta.currency) meta.currency = currencyForLocale(locale);
    // Zalando exposes brand reliably in JSON-LD; OG fallback already
    // picked it up. No override needed.
    return meta;
  },
};
