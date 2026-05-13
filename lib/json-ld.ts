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
}) {
  const offers: Record<string, unknown> = {
    "@type": "Offer",
    priceCurrency: item.currency,
    price: item.price > 0 ? item.price : undefined,
    availability: "https://schema.org/InStock",
  };
  if (item.buyUrl && item.buyUrl !== "#") {
    offers.url = item.buyUrl;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_BASE}/produkt/${item.id}#product`,
    name: item.name,
    brand: { "@type": "Brand", name: item.brand },
    image: abs(item.image),
    url: abs(`/produkt/${item.id}`),
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

// Re-export TaggedItem for ergonomics
export type { TaggedItem };
