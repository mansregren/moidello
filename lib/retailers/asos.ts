/**
 * ASOS-modul.
 *
 * ASOS sitter bakom Akamai-class bot-detection — server-side fetch timeoutar
 * oavsett user-agent. Vi kan inte hämta HTML, JSON-API eller image-CDN.
 *
 * Istället parsar vi bara URL:en. ASOS produktlänkar har formatet:
 *   /{locale}/{brand-slug}/{product-slug}/prd/{product-id}
 * t.ex.
 *   /se/4th-reckless/4th-reckless-vinrod-och-rosarandig-rugbytroja-.../prd/210025596
 *
 * Vi får ut märke + ett gissat produktnamn. Pris, färg, bild blir manuella —
 * men det är fortfarande bättre än att vänta 5 s på en timeout och få noll.
 */

import type { Retailer, ProductMeta, Locale } from "./types";

const LOCALES: Locale[] = [
  "se",
  "com",
  "de",
  "fr",
  "us",
  "it",
  "es",
  "nl",
  "dk",
  "fi",
  "ie",
  "au",
  "ru",
  "pl",
];

const LOCALE_TO_CURRENCY: Record<string, string> = {
  se: "SEK",
  dk: "DKK",
  fi: "EUR",
  de: "EUR",
  fr: "EUR",
  it: "EUR",
  es: "EUR",
  nl: "EUR",
  ie: "EUR",
  pl: "PLN",
  us: "USD",
  au: "AUD",
  com: "GBP",
};

function detectLocale(url: URL): Locale | null {
  const segs = url.pathname.split("/").filter(Boolean);
  return segs.length >= 1 && LOCALES.includes(segs[0]) ? segs[0] : null;
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ASOS-slugs har ofta "-exklusivt-hos-asos" / "-only-at-asos" som suffix.
// Trimma så namnet blir renare.
const SLUG_NOISE = [
  /-exklusivt-hos-asos$/i,
  /-only-at-asos$/i,
  /-eksklusivt-pa-asos$/i,
  /-asos-design$/i,
];

function cleanProductSlug(slug: string): string {
  let out = slug;
  for (const re of SLUG_NOISE) out = out.replace(re, "");
  return out;
}

export const asos: Retailer = {
  id: "asos",
  name: "ASOS",
  domains: ["asos.com"],
  supportedLocales: LOCALES,
  skipFetch: true,
  match(url) {
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return host === "asos.com" || host.endsWith(".asos.com");
  },
  detectLocale,
  rewriteForLocale(url, target) {
    if (!LOCALES.includes(target)) return url;
    const segs = url.pathname.split("/").filter(Boolean);
    if (segs.length >= 1 && LOCALES.includes(segs[0])) {
      segs[0] = target;
      const next = new URL(url);
      next.pathname = "/" + segs.join("/");
      return next;
    }
    return url;
  },
  async extract(_html, url): Promise<Partial<ProductMeta>> {
    const segs = url.pathname.split("/").filter(Boolean);
    const localeIdx = segs.length >= 1 && LOCALES.includes(segs[0]) ? 0 : -1;
    const brandIdx = localeIdx + 1;
    const productIdx = localeIdx + 2;

    const brandSlug = segs[brandIdx] ?? null;
    const productSlug = segs[productIdx] ?? null;

    let brand: string | null = brandSlug ? titleCase(brandSlug) : null;
    let product_name: string | null = null;

    if (productSlug) {
      let core = cleanProductSlug(productSlug);
      if (brandSlug && core.startsWith(brandSlug + "-")) {
        core = core.slice(brandSlug.length + 1);
      }
      product_name = core ? titleCase(core) : null;
    }

    // "Asos Design" → ASOS som märke
    if (brand && /^asos[-\s]design$/i.test(brand)) {
      brand = "ASOS Design";
    }

    const locale = detectLocale(url);
    const currency = locale ? (LOCALE_TO_CURRENCY[locale] ?? null) : null;

    return {
      brand,
      product_name,
      price: null,
      currency,
      color: null,
      image_url: null,
      retailer: "asos",
      retailer_locale: locale,
    };
  },
};
