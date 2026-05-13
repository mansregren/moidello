/**
 * Stub-retailers: matchar domänen, sätter retailer-id, men gör ingen
 * locale-rewrite — bara Open Graph-fallback för metadata-extraction.
 * Att utöka till fulla moduler är bara att lägga en .ts-fil och
 * lägga in den i index.ts.
 */

import type { Retailer, ProductMeta } from "./types";
import { openGraphFallback } from "./openGraphFallback";

interface StubConfig {
  id: string;
  name: string;
  domains: string[];
  fixedBrand?: string;
}

function makeStub(cfg: StubConfig): Retailer {
  return {
    id: cfg.id,
    name: cfg.name,
    domains: cfg.domains,
    supportedLocales: [],
    match(url) {
      const host = url.hostname.replace(/^www\./, "").toLowerCase();
      return cfg.domains.some((d) => host === d || host.endsWith(`.${d}`));
    },
    detectLocale: () => null,
    rewriteForLocale: (url) => url,
    async extract(html, url) {
      const meta: Partial<ProductMeta> = {
        ...openGraphFallback(html, url),
        retailer: cfg.id,
      };
      if (cfg.fixedBrand) meta.brand = cfg.fixedBrand;
      return meta;
    },
  };
}

export const nakd = makeStub({
  id: "nakd",
  name: "NA-KD",
  domains: ["na-kd.com"],
  fixedBrand: "NA-KD",
});

export const nelly = makeStub({
  id: "nelly",
  name: "Nelly",
  domains: ["nelly.com"],
  fixedBrand: "Nelly",
});

export const cos = makeStub({
  id: "cos",
  name: "COS",
  domains: ["cos.com"],
  fixedBrand: "COS",
});

export const arket = makeStub({
  id: "arket",
  name: "ARKET",
  domains: ["arket.com"],
  fixedBrand: "ARKET",
});

export const hm = makeStub({
  id: "hm",
  name: "H&M",
  domains: ["hm.com", "www2.hm.com"],
  fixedBrand: "H&M",
});

export const acnestudios = makeStub({
  id: "acnestudios",
  name: "Acne Studios",
  domains: ["acnestudios.com"],
  fixedBrand: "Acne Studios",
});

export const filippak = makeStub({
  id: "filippak",
  name: "Filippa K",
  domains: ["filippa-k.com"],
  fixedBrand: "Filippa K",
});

export const toteme = makeStub({
  id: "toteme",
  name: "Toteme",
  domains: ["toteme.com", "toteme-studio.com"],
  fixedBrand: "Toteme",
});

export const ganni = makeStub({
  id: "ganni",
  name: "Ganni",
  domains: ["ganni.com"],
  fixedBrand: "Ganni",
});

export const sezane = makeStub({
  id: "sezane",
  name: "Sezane",
  domains: ["sezane.com"],
  fixedBrand: "Sezane",
});

export const mango = makeStub({
  id: "mango",
  name: "Mango",
  domains: ["mango.com", "shop.mango.com"],
  fixedBrand: "Mango",
});
