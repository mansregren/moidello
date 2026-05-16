/**
 * Retailer-modul-kontrakt. Varje retailer i lib/retailers/ exporterar
 * en `Retailer`-instans. Index:n samlar in dem och routar urls till rätt
 * modul via `match()`.
 */

export type Locale = string; // 'se', 'dk', 'no', 'fi', 'de', 'gb', 'us', 'int', etc.

export interface ProductMeta {
  brand?: string | null;
  product_name?: string | null;
  price?: number | null;
  currency?: string | null;
  color?: string | null;
  image_url?: string | null;
  retailer?: string | null;
  retailer_locale?: Locale | null;
}

export interface Retailer {
  /** Stable id used in DB (`tagged_items.retailer`) */
  id: string;
  /** Display name in admin UI */
  name: string;
  /** Bare hostnames this retailer matches (without protocol/www) */
  domains: string[];
  /** Locales this retailer can be rewritten to */
  supportedLocales: Locale[];
  /** True när retailern blockerar server-side fetch (Akamai osv). Routen
   * hoppar då över HTML-hämtningen och anropar extract med tom HTML —
   * modulen får göra det bästa den kan av URL:en. */
  skipFetch?: boolean;
  /** Quick check used to route a URL to this module */
  match(url: URL): boolean;
  /** Extract product meta from fetched HTML */
  extract(html: string, url: URL): Promise<Partial<ProductMeta>>;
  /** Detect which locale the current URL belongs to (e.g. 'se' from /se/...) */
  detectLocale(url: URL): Locale | null;
  /** Rewrite the URL to a different locale's version. Returns the original
   * URL unchanged if rewriting isn't possible. */
  rewriteForLocale(url: URL, target: Locale): URL;
}
