import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { GUIDES } from "@/lib/guides";

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
    { url: `${BASE_URL}/trendigt`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/brands`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/guider`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${BASE_URL}/ordlista`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/om`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/welcome`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
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

  // Sitemap runs at build time (and revalidation) without an HTTP
  // request, so we can't use the cookie-based server client. The
  // anon-key client respects the same RLS policies — it just sees the
  // public-readable subset (published outfits, named profiles, etc.).
  const supabase = createPublicClient();

  const [outfitsRes, profilesRes, brandsRes, tagDimsRes] = await Promise.all([
    supabase
      .from("outfits")
      .select(
        `id, slug, updated_at, created_at,
         profiles!outfits_user_id_fkey(username)`,
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(10000),
    supabase
      .from("profiles")
      .select("username, updated_at"),
    supabase
      .from("tagged_items")
      .select("brand"),
    supabase
      .from("tagged_items")
      .select("color, garment, outfit_id, outfits!inner(gender, is_published)")
      .eq("is_active", true)
      .eq("outfits.is_published", true),
  ]);

  type OutfitRow = {
    id: string;
    slug: string | null;
    updated_at: string | null;
    created_at: string | null;
    profiles: { username: string } | null;
  };
  const outfitRoutes: MetadataRoute.Sitemap = (
    (outfitsRes.data ?? []) as unknown as OutfitRow[]
  ).map((o) => {
    const username = o.profiles?.username?.toLowerCase();
    const path =
      o.slug && username
        ? `/${username}/${o.slug}`
        : `/outfit/${o.id}`;
    return {
      url: `${BASE_URL}${path}`,
      lastModified: o.updated_at
        ? new Date(o.updated_at)
        : o.created_at
          ? new Date(o.created_at)
          : now,
      changeFrequency: "weekly",
      priority: 0.7,
    };
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

  // Distinct brand slugs from tagged_items.
  const brandSlugs = new Set<string>();
  for (const row of brandsRes.data ?? []) {
    const name = (row.brand as string)?.trim();
    if (!name) continue;
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    if (slug) brandSlugs.add(slug);
  }
  const brandRoutes: MetadataRoute.Sitemap = Array.from(brandSlugs).map((slug) => ({
    url: `${BASE_URL}/brand/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Färg- och typ-landningssidor — long-tail-magneter. En route per
  // distinkt color resp. (gender, garment)-kombo som har minst 2 outfits
  // (under det blir det thin content och inte värt att indexera).
  type TagDim = {
    color: string | null;
    garment: string | null;
    outfits: { gender: "dam" | "herr" } | null;
  };
  const tagDims = (tagDimsRes.data ?? []) as unknown as TagDim[];

  const colorCounts = new Map<string, number>();
  const garmentCounts = new Map<string, number>(); // key = "gender|garment"
  for (const r of tagDims) {
    if (r.color) {
      const c = r.color.toLowerCase().trim();
      if (c) colorCounts.set(c, (colorCounts.get(c) ?? 0) + 1);
    }
    if (r.outfits && r.garment) {
      const g = r.garment.toLowerCase().trim();
      const key = `${r.outfits.gender}|${g}`;
      garmentCounts.set(key, (garmentCounts.get(key) ?? 0) + 1);
    }
  }

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
    .map(([key]) => {
      const [gender, garment] = key.split("|");
      return {
        url: `${BASE_URL}/typ/${gender}/${slug(garment)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.65,
      };
    });

  // Hard-coded list of canonical outfit-styles. We don't gate on count
  // here — these are top-level taxonomy nodes; the page itself does a
  // notFound() if zero outfits match, so unused slugs just return 404
  // instead of being broken sitemap entries.
  const styleSlugs = [
    "minimalism",
    "vintage",
    "casual",
    "streetwear",
    "formal",
    "sporty",
    "preppy",
  ];
  const styleRoutes: MetadataRoute.Sitemap = styleSlugs.map((s) => ({
    url: `${BASE_URL}/stil/${s}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  return [
    ...staticRoutes,
    ...guideRoutes,
    ...outfitRoutes,
    ...profileRoutes,
    ...brandRoutes,
    ...colorRoutes,
    ...typeRoutes,
    ...styleRoutes,
  ];
}
