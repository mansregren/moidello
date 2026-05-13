/**
 * Shared rewrite-correctness matrix for every retailer module.
 *
 * Each retailer is tested for the three rewrite paths plus retailer-
 * specific edge cases:
 *   1. REPLACE  — URL already carries a different locale segment
 *   2. PREPEND  — URL has no locale segment yet
 *   3. IDEMPOTENT — URL already has the target locale
 *
 * The bug we caught on johnhenric (c3ded66) was a hidden 4th path: a
 * URL with a non-rewrite-target locale (e.g. /gb/) being treated as
 * "no locale" and triggering prepend → /se/gb/foo. The replace tests
 * here cover that case explicitly.
 */
import { describe, expect, test } from "vitest";
import { johnhenric } from "./johnhenric";
import { zalando } from "./zalando";
import { stories } from "./stories";
import { hm } from "./hm";
import { cos } from "./cos";
import { arket } from "./arket";
import { nakd } from "./nakd";
import { nelly } from "./nelly";
import { filippak } from "./filippak";
import type { Retailer, Locale } from "./types";

function rewriteUrl(retailer: Retailer, raw: string, target: Locale): URL {
  return retailer.rewriteForLocale(new URL(raw), target);
}

// ----- path-segment retailers --------------------------------------------
// Each entry below tests one retailer that rewrites by swapping a path
// segment (everyone except Zalando). The `urls` map maps a locale code
// to the URL we'd EXPECT for that locale, so we can pivot between any
// two locales and verify both replace and idempotent paths.

interface PathRetailerCase {
  name: string;
  retailer: Retailer;
  /** Different locales' URLs for the same product, by Locale → URL */
  urls: Record<Locale, string>;
  /** URL with no locale segment at all (for prepend test) */
  bare: string;
  /** A URL whose first path segment looks locale-shaped but is NOT one
   * the retailer rewrites to. Tests that an unknown-locale prefix is
   * still recognised as a segment to swap (the johnhenric /gb/ bug). */
  foreignLocaleUrl?: { url: string; expectAfter: (target: Locale) => string };
}

const PATH_CASES: PathRetailerCase[] = [
  {
    name: "johnhenric",
    retailer: johnhenric,
    urls: {
      se: "https://johnhenric.com/se/dark-brown-suede-loafers-a02976",
      no: "https://johnhenric.com/no/dark-brown-suede-loafers-a02976",
      dk: "https://johnhenric.com/dk/dark-brown-suede-loafers-a02976",
      fi: "https://johnhenric.com/fi/dark-brown-suede-loafers-a02976",
      de: "https://johnhenric.com/de/dark-brown-suede-loafers-a02976",
    },
    bare: "https://johnhenric.com/dark-brown-suede-loafers-a02976",
    foreignLocaleUrl: {
      url: "https://johnhenric.com/gb/dark-brown-suede-loafers-a02976",
      expectAfter: (target) =>
        `https://johnhenric.com/${target}/dark-brown-suede-loafers-a02976`,
    },
  },
  {
    name: "stories",
    retailer: stories,
    urls: {
      se: "https://www.stories.com/en_sek/dresses/product.html",
      dk: "https://www.stories.com/en_dkk/dresses/product.html",
      gb: "https://www.stories.com/en_gbp/dresses/product.html",
      us: "https://www.stories.com/en_usd/dresses/product.html",
    },
    bare: "https://www.stories.com/dresses/product.html",
    foreignLocaleUrl: {
      url: "https://www.stories.com/en_aud/dresses/product.html",
      expectAfter: (target) => {
        const seg: Record<string, string> = {
          se: "en_sek",
          no: "en_nok",
          dk: "en_dkk",
          gb: "en_gbp",
          us: "en_usd",
        };
        return `https://www.stories.com/${seg[target] ?? seg.se}/dresses/product.html`;
      },
    },
  },
  {
    name: "hm",
    retailer: hm,
    urls: {
      se: "https://www2.hm.com/sv_se/productpage.0123.html",
      dk: "https://www2.hm.com/da_dk/productpage.0123.html",
      us: "https://www2.hm.com/en_us/productpage.0123.html",
      gb: "https://www2.hm.com/en_gb/productpage.0123.html",
    },
    bare: "https://www2.hm.com/productpage.0123.html",
    foreignLocaleUrl: {
      url: "https://www2.hm.com/ja_jp/productpage.0123.html",
      expectAfter: (target) => {
        const seg: Record<string, string> = {
          se: "sv_se",
          dk: "da_dk",
          us: "en_us",
          gb: "en_gb",
        };
        return `https://www2.hm.com/${seg[target] ?? seg.se}/productpage.0123.html`;
      },
    },
  },
  {
    name: "cos",
    retailer: cos,
    urls: {
      se: "https://www.cos.com/en_sek/men/shirts/product.html",
      gb: "https://www.cos.com/en_gbp/men/shirts/product.html",
    },
    bare: "https://www.cos.com/men/shirts/product.html",
    foreignLocaleUrl: {
      url: "https://www.cos.com/en_aud/men/shirts/product.html",
      expectAfter: (target) => {
        const seg: Record<string, string> = {
          se: "en_sek",
          gb: "en_gbp",
        };
        return `https://www.cos.com/${seg[target] ?? seg.se}/men/shirts/product.html`;
      },
    },
  },
  {
    name: "arket",
    retailer: arket,
    urls: {
      se: "https://www.arket.com/en_sek/men/shirts.html",
      dk: "https://www.arket.com/en_dkk/men/shirts.html",
    },
    bare: "https://www.arket.com/men/shirts.html",
  },
  {
    name: "nakd",
    retailer: nakd,
    urls: {
      se: "https://www.na-kd.com/sv/dresses/product",
      no: "https://www.na-kd.com/no/dresses/product",
      gb: "https://www.na-kd.com/en-gb/dresses/product",
      us: "https://www.na-kd.com/en/dresses/product",
    },
    bare: "https://www.na-kd.com/dresses/product",
  },
  {
    name: "nelly",
    retailer: nelly,
    urls: {
      se: "https://nelly.com/se/dresses/product",
      no: "https://nelly.com/no/dresses/product",
      dk: "https://nelly.com/dk/dresses/product",
      fi: "https://nelly.com/fi/dresses/product",
    },
    bare: "https://nelly.com/dresses/product",
    foreignLocaleUrl: {
      // Was a regression risk: pathSegment used to filter on SUPPORTED,
      // so /en/foo would null-out and fall into prepend → /se/en/foo.
      url: "https://nelly.com/en/dresses/product",
      expectAfter: (target) => `https://nelly.com/${target}/dresses/product`,
    },
  },
  {
    name: "filippak",
    retailer: filippak,
    urls: {
      se: "https://www.filippa-k.com/sv-se/women/dresses",
      gb: "https://www.filippa-k.com/en-gb/women/dresses",
      us: "https://www.filippa-k.com/en-us/women/dresses",
    },
    bare: "https://www.filippa-k.com/women/dresses",
  },
];

for (const c of PATH_CASES) {
  describe(`${c.name}.rewriteForLocale`, () => {
    const locales = Object.keys(c.urls) as Locale[];

    // REPLACE: each (source, target) pair where source != target
    for (const source of locales) {
      for (const target of locales) {
        if (source === target) continue;
        test(`replaces ${source} → ${target}`, () => {
          const result = rewriteUrl(c.retailer, c.urls[source], target);
          expect(result.toString()).toBe(c.urls[target]);
        });
      }
    }

    // PREPEND: URL with no locale → expect the target's URL pattern
    for (const target of locales.slice(0, 3)) {
      test(`prepends ${target} to bare URL`, () => {
        const result = rewriteUrl(c.retailer, c.bare, target);
        expect(result.toString()).toBe(c.urls[target]);
      });
    }

    // IDEMPOTENT: URL already at the target locale stays unchanged
    for (const target of locales.slice(0, 3)) {
      test(`is idempotent for ${target} (no-op)`, () => {
        const result = rewriteUrl(c.retailer, c.urls[target], target);
        expect(result.toString()).toBe(c.urls[target]);
      });
    }

    // FOREIGN-LOCALE: URL has a locale-shaped prefix that isn't a rewrite
    // target — must still be replaced, never prepended-onto. Exact-URL
    // match is the real assertion here.
    if (c.foreignLocaleUrl) {
      const { url, expectAfter } = c.foreignLocaleUrl;
      for (const target of locales.slice(0, 3)) {
        test(`swaps non-target locale to ${target} (no double-prefix)`, () => {
          const result = rewriteUrl(c.retailer, url, target);
          expect(result.toString()).toBe(expectAfter(target));
        });
      }
    }
  });
}

// ----- Zalando (hostname swap, not path) ---------------------------------
describe("zalando.rewriteForLocale", () => {
  const baseUrl = "https://www.zalando.fr/dresses/some-product-1234.html";

  test("replaces TLD se → dk", () => {
    const result = zalando.rewriteForLocale(
      new URL("https://www.zalando.se/dresses/some-product-1234.html"),
      "dk",
    );
    expect(result.hostname).toBe("zalando.dk");
    expect(result.pathname).toBe("/dresses/some-product-1234.html");
  });

  test("replaces TLD fr → no", () => {
    const result = zalando.rewriteForLocale(new URL(baseUrl), "no");
    expect(result.hostname).toBe("zalando.no");
  });

  test("is idempotent for matching TLD", () => {
    const url = new URL("https://www.zalando.se/dresses/product.html");
    const result = zalando.rewriteForLocale(url, "se");
    expect(result.hostname).toBe("zalando.se");
  });

  test("preserves query parameters across rewrite", () => {
    const result = zalando.rewriteForLocale(
      new URL("https://www.zalando.fr/dresses/p.html?size=M&color=red"),
      "dk",
    );
    expect(result.hostname).toBe("zalando.dk");
    expect(result.searchParams.get("size")).toBe("M");
    expect(result.searchParams.get("color")).toBe("red");
  });

  test("returns input unchanged when target TLD unknown", () => {
    const result = zalando.rewriteForLocale(new URL(baseUrl), "br" as Locale);
    expect(result.toString()).toBe(baseUrl);
  });
});

// ----- Cross-cutting invariant -------------------------------------------
describe("rewrite invariants across all retailers", () => {
  const all = [
    johnhenric,
    stories,
    hm,
    cos,
    arket,
    nakd,
    nelly,
    filippak,
  ] as const;

  test("no retailer produces a double-locale path", () => {
    for (const r of all) {
      for (const target of r.supportedLocales.slice(0, 3)) {
        const sample = new URL(
          `https://${r.domains[0]}/some-locale-shape-foo`,
        );
        const result = r.rewriteForLocale(sample, target);
        expect(
          result.pathname,
          `${r.id}: produced double-locale segment for target=${target}`,
        ).not.toMatch(
          /^\/(?:[a-z]{2,3}(?:[-_][a-z]{2,3})?)\/(?:[a-z]{2,3}(?:[-_][a-z]{2,3})?)\//i,
        );
      }
    }
  });

  test("rewriting to an unsupported locale never throws", () => {
    for (const r of all) {
      expect(() =>
        r.rewriteForLocale(
          new URL(`https://${r.domains[0]}/foo`),
          "xx" as Locale,
        ),
      ).not.toThrow();
    }
  });
});
