import type { MetadataRoute } from "next";

const BASE_URL = "https://moidello.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Default: allow most crawlers everywhere except private routes
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/onboarding",
          "/meddelanden",
          "/meddelanden/",
          "/profil",
          "/profil/",
          "/brand-dashboard",
          "/login",
          "/signup",
          // Filtered/searched discover URLs are duplicates of /upptack
          "/upptack?",
        ],
      },
      {
        // Pinterest indexes outfit + product imagery aggressively, give them
        // explicit access in case wildcard rules ever change.
        userAgent: ["Pinterestbot", "Pinterest"],
        allow: "/",
      },
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/sitemap-images.xml`,
    ],
    host: BASE_URL,
  };
}
