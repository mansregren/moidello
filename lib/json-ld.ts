/**
 * Schema.org JSON-LD builders. Each function returns a plain object —
 * the JsonLd component handles the <script> tag + escaping.
 *
 * We use absolute URLs everywhere because crawlers consume these out of
 * context and many fail to resolve relative paths.
 */

import type { Outfit, User, TaggedItem } from "@/lib/types";

export const SITE_BASE = "https://moidello.com";
const SITE_NAME = "Moidello";

function abs(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** WebSite + sitelinks SearchBox + Organization for the root layout. */
export function siteJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_BASE}/#organization`,
      name: SITE_NAME,
      url: SITE_BASE,
      logo: abs("/icon.svg"),
      sameAs: [
        "https://www.instagram.com/moidello",
        "https://www.tiktok.com/@moidello",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        email: "hello@moidello.com",
        contactType: "customer service",
        availableLanguage: ["Swedish", "English"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_BASE}/#website`,
      name: SITE_NAME,
      url: SITE_BASE,
      publisher: { "@id": `${SITE_BASE}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_BASE}/upptack?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

interface PersonInput {
  user: User;
  /** Path to the canonical profile page */
  url?: string;
}

/** Person schema for a creator. Pulls social handles from profile.* fields. */
export function personJsonLd({ user, url }: PersonInput) {
  const sameAs: string[] = [];
  if (user.instagram) {
    sameAs.push(
      user.instagram.startsWith("http")
        ? user.instagram
        : `https://instagram.com/${user.instagram.replace(/^@/, "")}`,
    );
  }
  if (user.tiktok) {
    sameAs.push(
      user.tiktok.startsWith("http")
        ? user.tiktok
        : `https://www.tiktok.com/@${user.tiktok.replace(/^@/, "")}`,
    );
  }
  if (user.youtube) {
    sameAs.push(
      user.youtube.startsWith("http")
        ? user.youtube
        : `https://www.youtube.com/@${user.youtube.replace(/^@/, "")}`,
    );
  }
  if (user.website) {
    sameAs.push(
      user.website.startsWith("http") ? user.website : `https://${user.website}`,
    );
  }

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_BASE}${url ?? `/profile/${user.username.toLowerCase()}`}#person`,
    name: user.displayName,
    alternateName: `@${user.username}`,
    url: abs(url ?? `/profile/${user.username.toLowerCase()}`),
    image: user.avatar ? abs(user.avatar) : undefined,
    description: user.bio || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
}

/** Product schema for an individual tagged garment. */
export function productJsonLd(item: {
  id: string;
  brand: string;
  name: string;
  price: number;
  currency: string;
  buyUrl?: string;
  image: string;
  /** AI-generated long-form description (preferred over auto-fallback). */
  description?: string | null;
  /** Material (linne, ull, denim, …) — emitted as additionalProperty. */
  material?: string | null;
  /** Color — emitted as schema.org/color when present. */
  color?: string | null;
  /** AI-generated keywords — emitted as schema.org/keywords (comma-sep). */
  keywords?: string[];
}) {
  // Only emit Offer when we have a real price — Google flags an Offer
  // with priceCurrency but no price as invalid ("Ange antingen price
  // eller priceSpecification.price"). A Product without an Offer is
  // still valid; it just won't show price in rich results.
  //
  // seller is set to the brand because Moidello is *not* the merchant —
  // we link out to the brand's own site. Without seller, Google assumes
  // the page owner (Moidello) is selling, which is misleading.
  let offers: Record<string, unknown> | undefined;
  if (item.price > 0) {
    offers = {
      "@type": "Offer",
      priceCurrency: item.currency,
      price: item.price,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: item.brand },
    };
    if (item.buyUrl && item.buyUrl !== "#") {
      offers.url = item.buyUrl;
    }
  }

  // Prefer AI-generated description over the auto-fallback. The fallback
  // is intentionally short so duplicate-content checks don't penalize
  // unbackfilled rows; once 0036-backfill runs, every product page gets
  // a unique long-form description for the rich-result snippet.
  const description =
    item.description?.trim() ||
    `${item.brand} ${item.name} — taggat plagg från en outfit på ${SITE_NAME}.`;

  const additionalProperty: Array<{
    "@type": "PropertyValue";
    name: string;
    value: string;
  }> = [];
  if (item.material?.trim()) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "Material",
      value: item.material.trim(),
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_BASE}/produkt/${item.id}#product`,
    name: `${item.brand} ${item.name}`,
    description,
    brand: { "@type": "Brand", name: item.brand },
    image: abs(item.image),
    url: abs(`/produkt/${item.id}`),
    color: item.color?.trim() || undefined,
    material: item.material?.trim() || undefined,
    keywords:
      item.keywords && item.keywords.length > 0
        ? item.keywords.join(", ")
        : undefined,
    additionalProperty:
      additionalProperty.length > 0 ? additionalProperty : undefined,
    offers,
  };
}

/** Combined graph for an outfit detail page. */
export function outfitPageJsonLd(outfit: Outfit) {
  // Match the canonical URL the layout sets — /<username>/<slug> when
  // both are present, /outfit/<id> as a fallback for legacy/mock rows.
  const outfitUrl =
    outfit.slug && outfit.creator.username
      ? `/${outfit.creator.username.toLowerCase()}/${outfit.slug}`
      : `/outfit/${outfit.id}`;
  const graph: object[] = [
    {
      "@type": "ImageObject",
      "@id": `${SITE_BASE}${outfitUrl}#image`,
      contentUrl: abs(outfit.image),
      url: abs(outfit.image),
      caption: outfit.title,
      description: outfit.description || undefined,
      author: { "@id": `${SITE_BASE}/profile/${outfit.creator.username.toLowerCase()}#person` },
    },
    personJsonLd({ user: outfit.creator }),
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: SITE_NAME,
          item: SITE_BASE,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Outfits",
          item: `${SITE_BASE}/upptack`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: outfit.title,
          item: abs(outfitUrl),
        },
      ],
    },
  ];

  for (const tag of outfit.tags) {
    graph.push(
      productJsonLd({
        id: tag.id,
        brand: tag.brand,
        name: tag.name,
        price: tag.price,
        currency: tag.currency,
        buyUrl: tag.buyUrl,
        image: outfit.image,
        description: tag.description,
        material: tag.material,
        color: tag.color,
        keywords: tag.keywords,
      }),
    );
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

/** Person + ItemList (their outfits) for a creator profile page. */
export function profilePageJsonLd(user: User, outfits: Outfit[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      personJsonLd({ user }),
      {
        "@type": "ItemList",
        "@id": `${SITE_BASE}/profile/${user.username.toLowerCase()}#outfits`,
        numberOfItems: outfits.length,
        itemListElement: outfits.slice(0, 50).map((o, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: abs(
            o.slug && o.creator.username
              ? `/${o.creator.username.toLowerCase()}/${o.slug}`
              : `/outfit/${o.id}`,
          ),
          name: o.title,
          image: abs(o.image),
        })),
      },
    ],
  };
}

/** Product page: Product + Breadcrumb. */
export function produktPageJsonLd(item: {
  id: string;
  brand: string;
  name: string;
  price: number;
  currency: string;
  buyUrl?: string;
  outfitImage: string;
  outfitId: string;
  outfitSlug?: string | null;
  outfitTitle: string;
  outfitCreatorUsername?: string;
  description?: string | null;
  material?: string | null;
  color?: string | null;
  keywords?: string[];
}) {
  const outfitPath =
    item.outfitSlug && item.outfitCreatorUsername
      ? `/${item.outfitCreatorUsername.toLowerCase()}/${item.outfitSlug}`
      : `/outfit/${item.outfitId}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      productJsonLd({
        id: item.id,
        brand: item.brand,
        name: item.name,
        price: item.price,
        currency: item.currency,
        buyUrl: item.buyUrl,
        image: item.outfitImage,
        description: item.description,
        material: item.material,
        color: item.color,
        keywords: item.keywords,
      }),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_BASE },
          {
            "@type": "ListItem",
            position: 2,
            name: item.outfitTitle,
            item: abs(outfitPath),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${item.brand} ${item.name}`,
            item: abs(`/produkt/${item.id}`),
          },
        ],
      },
    ],
  };
}

/** Brand page: Brand + Breadcrumb + ItemList of outfits tagging this brand. */
export function brandPageJsonLd(brand: {
  slug: string;
  name: string;
  logo?: string | null;
  website?: string | null;
  description?: string | null;
  outfits: Outfit[];
}) {
  const url = `/brand/${brand.slug.toLowerCase()}`;
  const sameAs = brand.website
    ? [brand.website.startsWith("http") ? brand.website : `https://${brand.website}`]
    : undefined;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Brand",
        "@id": `${SITE_BASE}${url}#brand`,
        name: brand.name,
        url: abs(url),
        logo: brand.logo ? abs(brand.logo) : undefined,
        description: brand.description || undefined,
        sameAs,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_BASE },
          {
            "@type": "ListItem",
            position: 2,
            name: "Märken",
            item: `${SITE_BASE}/brands`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: brand.name,
            item: abs(url),
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_BASE}${url}#outfits`,
        numberOfItems: brand.outfits.length,
        itemListElement: brand.outfits.slice(0, 50).map((o, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: abs(
            o.slug && o.creator.username
              ? `/${o.creator.username.toLowerCase()}/${o.slug}`
              : `/outfit/${o.id}`,
          ),
          name: o.title,
          image: abs(o.image),
        })),
      },
    ],
  };
}

/**
 * FAQPage schema for the /faq page. AI search models (ChatGPT,
 * Perplexity, Claude) lean heavily on FAQPage data to extract quotable
 * answers. Keep each answer short and standalone so a model can lift
 * it verbatim without needing surrounding context.
 */
export function faqPageJsonLd(qa: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_BASE}/faq#faq`,
    url: abs("/faq"),
    isPartOf: { "@id": `${SITE_BASE}/#website` },
    mainEntity: qa.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

/**
 * CollectionPage + ItemList for index/discovery pages.
 * Used by the home page (curated front) and /upptack (full catalog) so
 * each can show as a rich result with a carousel of outfits in Google.
 */
export function collectionPageJsonLd({
  path,
  name,
  description,
  outfits,
}: {
  path: string;
  name: string;
  description: string;
  outfits: Outfit[];
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_BASE}${path}#collection`,
        url: abs(path),
        name,
        description,
        isPartOf: { "@id": `${SITE_BASE}/#website` },
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_BASE}${path}#outfits`,
        numberOfItems: outfits.length,
        itemListElement: outfits.slice(0, 50).map((o, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: abs(
            o.slug && o.creator.username
              ? `/${o.creator.username.toLowerCase()}/${o.slug}`
              : `/outfit/${o.id}`,
          ),
          name: o.title,
          image: abs(o.image),
        })),
      },
    ],
  };
}

// Re-export TaggedItem for ergonomics
export type { TaggedItem };
