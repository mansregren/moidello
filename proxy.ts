import { type NextRequest } from "next/server";
import { proxySession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await proxySession(request);
}

export const config = {
  matcher: [
    // Static assets, sitemaps and robots never need a session.
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|sitemap-images.xml|robots.txt|llms.txt|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4)$).*)",
  ],
};
