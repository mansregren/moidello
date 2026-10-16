import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { GUIDES } from "@/lib/guides";
import { HOME_VERTICAL_PUBLIC, DAM_PUBLIC, PUBLIC_GENDER } from "@/lib/flags";
import { fetchBrandsAggregated } from "@/lib/queries";
import { HOME_ROOMS } from "@/lib/home-data";
import { canonicalColorLabel } from "@/lib/colors";
import { fetchCanonicalProducts } from "@/lib/product-canonical";
import { canonicalGarment } from "@/lib/garments";

const BASE_URL = "https://moidello.com";

// Cached and regenerated at most once an hour, rather than rebuilt
// against Supabase on every crawler request. When published outfits
// approach Google's 50k-URL-per-sitemap limit, split this into
// paginated sitemaps via generateSitemaps() — until then a single
// /sitemap.xml is correct and keeps robots.ts + Search Console stable.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/upptack`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/brands`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/guider`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${BASE_URL}/ordlista`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/om`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/kontakt`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/villkor`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/integritet`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const guideRoutes: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${BASE_URL}/guider/${g.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Home vertical is excluded from the sitemap until it's launched.
  const homeRoutes: MetadataRoute.Sitemap = HOME_VERTICAL_PUBLIC
    ? [
        {
          url: `${BASE_URL}/home`,
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: 0.8,
        },
        ...HOME_ROOMS.map((r) => ({
          url: `${BASE_URL}/home/${r.slug}`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.65,
        })),
      ]
    : [];

  // Sitemap runs at build time (and revalidation) without an HTTP
  // request, so we can't use the cookie-based server client. The
  // anon-key client respects the same RLS policies — it just sees the
  // public-readable subset (published outfits, named profiles, etc.).
  const supabase = createPublicClient();

  // While Dam is admin-only, Dam outfits are noindex and every landing
  // page is scoped to Herr — keep the sitemap to the same public subset so
  // it never lists a page that 404s or renders an empty grid.
  let outfitsQuery = supabase
    .from("outfits")
    .select(
      `id, slug, updated_at, created_at, category,
       profiles!outfits_user_id_fkey(username)`,
    )
    .eq("is_published", true)
    .eq("vertical", "mode");
  if (PUBLIC_GENDER) outfitsQuery = outfitsQuery.eq("gender", PUBLIC_GENDER);

  const [outfitsRes, profilesRes, brands, tagDimsRes, canonicalProducts] = await Promise.all([
    outfitsQuery.order("created_at", { ascending: false }).limit(10000),
    supabase
      .from("profiles")
      .select("username, updated_at"),
    fetchBrandsAggregated(supabase, PUBLIC_GENDER),
    supabase
      .from("tagged_items")
      .select("color, garment, outfit_id, outfits!inner(gender, is_published, vertical)")
      .eq("is_active", true)
      .eq("outfits.is_published", true)
      .eq("outfits.vertical", "mode"),
    fetchCanonicalProducts(supabase),
  ]);

  type OutfitRow = {
    id: string;
    slug: string | null;
    updated_at: string | null;
    created_at: string | null;
    category: string | null;
    profiles: { username: string } | null;
  };
  const outfitRoutes: MetadataRoute.Sitemap = (
    (outfitsRes.data ?? []) as unknown as OutfitRow[]
  ).flatMap((o) => {
    const username = o.profiles?.username?.toLowerCase();
    // Mirror the profile-route filter below: outfits owned by half-set-up
    // profiles (trigger-default "user_xxx" usernames) shouldn't be
    // advertised. Their /<username>/<slug> URL exposes an ugly path, and
    // the /outfit/<id> fallback 301-redirects straight back to it — so a
    // sitemap entry would just be a redirect Google reports as noise.
    if (username?.startsWith("user_")) return [];
    const path =
      o.slug && username
        ? `/${username}/${o.slug}`
        : `/outfit/${o.id}`;
    return [
      {
        url: `${BASE_URL}${path}`,
        lastModified: o.updated_at
          ? new Date(o.updated_at)
          : o.created_at
            ? new Date(o.created_at)
            : now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
    ];
  });

  // Skip the trigger-default usernames ("user_xxx") so we don't index
  // half-set-up profiles. Lowercase to match the canonical URL.
  const profileRoutes: MetadataRoute.Sitemap = (profilesRes.data ?? [])
    .map((p) => p.username as string)
    .filter((u) => !!u && !u.startsWith("user_"))
    .map((u) => ({
      url: `${BASE_URL}/profile/${u.toLowerCase()}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    }));

  // Same aggregation the /brand pages resolve against, so every listed
  // slug has a page (home-decor brands and Dam-only brands are left out).
  const brandRoutes: MetadataRoute.Sitemap = brands
    .filter((b) => b.outfitCount > 0)
    .map((b) => ({
    url: `${BASE_URL}/brand/${b.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Colour and type landing pages — long-tail magnets. One route per
  // distinct colour and per (gender, garment) combo with at least 2
  // outfits (below that it's thin content and not worth indexing).
  type TagDim = {
    color: string | null;
    garment: string | null;
    outfit_id: string;
    outfits: { gender: "dam" | "herr" } | null;
  };
  const tagDims = (tagDimsRes.data ?? []) as unknown as TagDim[];

  // Count distinct outfits (what the pages count), canonicalised so a
  // legacy Swedish value ("svart") and its English equivalent ("black")
  // merge into one page. Values with no canonical label have no page.
  const colorOutfits = new Map<string, Set<string>>();
  const garmentOutfits = new Map<string, Set<string>>(); // key = "gender|garment"
  const add = (m: Map<string, Set<string>>, k: string, id: string) => {
    const set = m.get(k) ?? new Set<string>();
    set.add(id);
    m.set(k, set);
  };
  for (const r of tagDims) {
    if (r.color && (!PUBLIC_GENDER || r.outfits?.gender === PUBLIC_GENDER)) {
      const c = canonicalColorLabel(r.color.toLowerCase().trim())?.toLowerCase();
      if (c) add(colorOutfits, c, r.outfit_id);
    }
    if (r.outfits && r.garment) {
      const g = canonicalGarment(r.garment.toLowerCase().trim())?.toLowerCase();
      if (g) add(garmentOutfits, `${r.outfits.gender}|${g}`, r.outfit_id);
    }
  }
  const colorCounts = new Map(
    Array.from(colorOutfits, ([k, ids]) => [k, ids.size] as const),
  );
  const garmentCounts = new Map(
    Array.from(garmentOutfits, ([k, ids]) => [k, ids.size] as const),
  );

  function slug(s: string): string {
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  const colorRoutes: MetadataRoute.Sitemap = Array.from(colorCounts.entries())
    .filter(([, count]) => count >= 2)
    .map(([color]) => ({
      url: `${BASE_URL}/farg/${slug(color)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));

  const typeRoutes: MetadataRoute.Sitemap = Array.from(garmentCounts.entries())
    .filter(([, count]) => count >= 2)
    // Dam type-landing pages 404 while DAM_PUBLIC is off — keep them out.
    .filter(([key]) => DAM_PUBLIC || !key.startsWith("dam|"))
    .map(([key]) => {
      const [gender, garment] = key.split("|");
      return {
        url: `${BASE_URL}/typ/${gender}/${slug(garment)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.65,
      };
    });

  // Canonical outfit styles — listed only when at least one public outfit
  // carries the style, since /stil/<slug> 404s on zero matches.
  const styleSlugs = [
    "minimalism",
    "vintage",
    "casual",
    "streetwear",
    "formal",
    "sporty",
    "preppy",
  ];
  const publicCategories = new Set(
    ((outfitsRes.data ?? []) as unknown as OutfitRow[])
      .map((o) => o.category?.toLowerCase().trim())
      .filter(Boolean),
  );
  const styleRoutes: MetadataRoute.Sitemap = styleSlugs
    .filter((s) => publicCategories.has(s))
    .map((s) => ({
    url: `${BASE_URL}/stil/${s}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  // One page per distinct piece (brand + name) — the long tail of
  // "<brand> <product>" searches.
  const productRoutes: MetadataRoute.Sitemap = Array.from(canonicalProducts.values(), (id) => ({
    url: `${BASE_URL}/produkt/${id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...guideRoutes,
    ...homeRoutes,
    ...outfitRoutes,
    ...profileRoutes,
    ...brandRoutes,
    ...colorRoutes,
    ...typeRoutes,
    ...styleRoutes,
    ...productRoutes,
  ];
}
