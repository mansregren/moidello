import type { MetadataRoute } from "next";
import { outfits, brands, users } from "@/lib/data";

const BASE_URL = "https://moidello.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/upptack`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/trendigt`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/brands`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/skapa`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/welcome`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const outfitRoutes: MetadataRoute.Sitemap = outfits.map((o) => ({
    url: `${BASE_URL}/outfit/${o.id}`,
    lastModified: o.createdAt ? new Date(o.createdAt) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const brandRoutes: MetadataRoute.Sitemap = brands.map((b) => ({
    url: `${BASE_URL}/brand/${b.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const userRoutes: MetadataRoute.Sitemap = users.map((u) => ({
    url: `${BASE_URL}/profile/${u.username}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...outfitRoutes, ...brandRoutes, ...userRoutes];
}
