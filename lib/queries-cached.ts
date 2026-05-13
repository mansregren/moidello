import { unstable_cache, revalidateTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { fetchTopCreators, fetchBrandsAggregated } from "@/lib/queries";
import type { BrandAggregate } from "@/lib/queries";
import type { User as MoidelloUser } from "@/lib/types";

/**
 * Cached top-creators. Uses the public/anon client so it doesn't touch
 * cookies — that lets unstable_cache work without hitting "dynamic context
 * in cached function" build errors. Revalidates every 5 minutes; can also
 * be invalidated via revalidateTag("top-creators") from publishing actions.
 */
export const fetchTopCreatorsCached = unstable_cache(
  async (limit: number): Promise<MoidelloUser[]> => {
    return fetchTopCreators(limit, createPublicClient());
  },
  ["top-creators-v1"],
  { revalidate: 300, tags: ["top-creators"] },
);

/**
 * Cached brand aggregate. Re-aggregates the entire tagged_items table —
 * expensive — so caching it for 5 min is a real win on /brands and /. Tagged
 * "brand-aggregate" for targeted invalidation from publish/admin actions.
 */
export const fetchBrandsAggregatedCached = unstable_cache(
  async (gender?: "dam" | "herr"): Promise<BrandAggregate[]> => {
    return fetchBrandsAggregated(createPublicClient(), gender);
  },
  ["brands-aggregated-v1"],
  { revalidate: 300, tags: ["brand-aggregate"] },
);

/**
 * Convenience: invalidate both caches. Call from server actions that
 * publish/unpublish outfits or claim brands. Next.js 16's revalidateTag
 * takes a cache-life profile as the second argument; "max" means
 * "invalidate immediately and rebuild on next request".
 */
export function invalidateAggregateCaches() {
  revalidateTag("top-creators", "max");
  revalidateTag("brand-aggregate", "max");
}
