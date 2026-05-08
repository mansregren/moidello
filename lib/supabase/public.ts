/**
 * Public (anon-key) Supabase client for build-time + static contexts
 * where the cookie-based server client can't run.
 *
 * Use this in:
 * - generateMetadata / generateImageMetadata
 * - opengraph-image.tsx, twitter-image.tsx
 * - sitemap.ts, sitemap routes, robots.ts
 * - any other code path that runs without an HTTP request
 *
 * For request-bound code (server actions, page components that call
 * supabase.auth.getUser, RLS-gated reads of saves/notifications/etc.)
 * keep using `@/lib/supabase/server`.
 *
 * RLS still applies — this client is the `anon` role, so it sees only
 * what's allowed by the public-readable policies (published outfits,
 * profiles, tagged_items, etc.).
 */

import { createClient } from "@supabase/supabase-js";

export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing",
    );
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
