import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";

const BASE_URL = "https://moidello.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/upptack`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/trendigt`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/brands`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/om`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/welcome`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/kontakt`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/villkor`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/integritet`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Sitemap runs at build time (and revalidation) without an HTTP
  // request, so we can't use the cookie-based server client. The
  // anon-key client respects the same RLS policies — it just sees the
  // public-readable subset (published outfits, named profiles, etc.).
  const supabase = createPublicClient();

  const [outfitsRes, profilesRes, brandsRes] = await Promise.all([
    supabase
      .from("outfits")
      .select("id, updated_at, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(10000),
    supabase
      .from("profiles")
      .select("username, updated_at"),
    supabase
      .from("tagged_items")
      .select("brand"),
  ]);

  const outfitRoutes: MetadataRoute.Sitemap = (outfitsRes.data ?? []).map((o) => ({
    url: `${BASE_URL}/outfit/${o.id}`,
    lastModified: o.updated_at
      ? new Date(o.updated_at as string)
      : o.created_at
        ? new Date(o.created_at as string)
        : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

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

  return [...staticRoutes, ...outfitRoutes, ...profileRoutes, ...brandRoutes];
}
