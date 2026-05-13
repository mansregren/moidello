/**
 * Detect whether a product URL has affiliate tracking on it. We never
 * geo-rewrite an affiliate URL — the creator's tracking would break.
 *
 * Two cases:
 *   1. Affiliate-redirector hosts: the URL itself is a tracker (LTK,
 *      ShopMy, Skimlinks, etc.) that resolves to the retailer.
 *   2. Direct-to-retailer URLs with affiliate query params (Awin,
 *      Adtraction, Tradedoubler).
 */

export type AffiliateNetwork =
  | "awin"
  | "adtraction"
  | "tradedoubler"
  | "ltk"
  | "shopmy"
  | "skimlinks"
  | "unknown";

export interface AffiliateInfo {
  isAffiliate: boolean;
  network: AffiliateNetwork | null;
}

const REDIRECTOR_HOSTS: Array<{
  match: (host: string) => boolean;
  network: AffiliateNetwork;
}> = [
  { match: (h) => h.endsWith("liketk.it") || h.endsWith("go.liketk.it"), network: "ltk" },
  { match: (h) => h.endsWith("rstyle.me"), network: "ltk" },
  { match: (h) => h.endsWith("shopstyle.it"), network: "ltk" },
  { match: (h) => h.endsWith("shopmy.us") || h.endsWith("go.shopmy.us"), network: "shopmy" },
  { match: (h) => h.endsWith("go.shopmy.cloud"), network: "shopmy" },
  { match: (h) => h.endsWith("go.skimresources.com"), network: "skimlinks" },
  { match: (h) => h.endsWith("redirect.viglink.com"), network: "skimlinks" },
  // Awin's own redirector lives at awin1.com / tidd.ly
  { match: (h) => h.endsWith("awin1.com") || h.endsWith("tidd.ly"), network: "awin" },
  // Adtraction redirector
  { match: (h) => h.endsWith("at.ratekey.com") || h.endsWith("track.adtraction.com"), network: "adtraction" },
  // Tradedoubler redirector
  { match: (h) => h.endsWith("clk.tradedoubler.com") || h.endsWith("clkrt.tradedoubler.com"), network: "tradedoubler" },
];

const PARAM_RULES: Array<{
  test: (params: URLSearchParams) => boolean;
  network: AffiliateNetwork;
}> = [
  {
    test: (p) =>
      p.has("awc") || p.has("awinaffid") || p.has("awinmid") || p.has("affid"),
    network: "awin",
  },
  {
    test: (p) => p.has("at_eid") || p.has("adtraction") || p.has("at_aid"),
    network: "adtraction",
  },
  {
    test: (p) => p.has("tduid") || p.has("tradedoubler"),
    network: "tradedoubler",
  },
];

export function detectAffiliate(input: string | URL): AffiliateInfo {
  let url: URL;
  try {
    url = typeof input === "string" ? new URL(input) : input;
  } catch {
    return { isAffiliate: false, network: null };
  }

  const host = url.hostname.toLowerCase();
  for (const r of REDIRECTOR_HOSTS) {
    if (r.match(host)) return { isAffiliate: true, network: r.network };
  }

  for (const rule of PARAM_RULES) {
    if (rule.test(url.searchParams)) {
      return { isAffiliate: true, network: rule.network };
    }
  }

  return { isAffiliate: false, network: null };
}
