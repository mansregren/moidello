import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/onboarding"],
    },
    sitemap: "https://moidello.com/sitemap.xml",
    host: "https://moidello.com",
  };
}
