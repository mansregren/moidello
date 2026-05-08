/**
 * Usernames that the routing layer claims for itself. New users can't
 * sign up with any of these because the slug-style outfit URL
 * /<username>/<slug> would collide with an existing static route or a
 * Next.js convention.
 *
 * Used by:
 * - onboarding action (creates the first profile row)
 * - /profil edit action (updates username)
 * - /[username]/[slug]/page.tsx route resolver (early notFound() for
 *   defence-in-depth in case a reserved name slips into the DB)
 */

export const RESERVED_USERNAMES = new Set<string>([
  // App routes
  "admin",
  "api",
  "app",
  "auth",
  "board",
  "brand",
  "brand-dashboard",
  "brands",
  "go",
  "integritet",
  "kontakt",
  "login",
  "meddelanden",
  "om",
  "onboarding",
  "outfit",
  "produkt",
  "profil",
  "profile",
  "signup",
  "skapa",
  "statistik",
  "trendigt",
  "upptack",
  "villkor",
  "welcome",
  // Next.js conventions + asset paths
  "_next",
  "favicon",
  "favicon.ico",
  "icon",
  "icon.svg",
  "apple-icon",
  "apple-icon.png",
  "manifest",
  "manifest.webmanifest",
  "opengraph-image",
  "robots.txt",
  "sitemap.xml",
  "sitemap-images.xml",
  "images",
]);

export function isReservedUsername(name: string): boolean {
  return RESERVED_USERNAMES.has(name.toLowerCase());
}
