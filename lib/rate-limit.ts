import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate-limit helper. Uses Upstash Redis when configured via env, otherwise
 * no-ops (so dev/preview deployments without KV don't crash). Env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 * Vercel KV-backed deployments expose KV_REST_API_URL / KV_REST_API_TOKEN —
 * we accept those as aliases.
 */

interface RateBucket {
  /** Allowed requests per window */
  limit: number;
  /** Window duration, e.g. "1 m" / "10 s" / "1 h" — Upstash Duration syntax */
  window: `${number} ${"ms" | "s" | "m" | "h" | "d"}`;
  /** Cache key prefix — keep stable across deploys to avoid resetting buckets */
  prefix: string;
}

const BUCKETS = {
  preview: { limit: 10, window: "1 m" as const, prefix: "rl:preview" },
  comment: { limit: 5, window: "1 m" as const, prefix: "rl:comment" },
  message: { limit: 5, window: "1 m" as const, prefix: "rl:message" },
  like: { limit: 60, window: "1 m" as const, prefix: "rl:like" },
  webhook: { limit: 120, window: "1 m" as const, prefix: "rl:webhook" },
} satisfies Record<string, RateBucket>;

export type RateBucketKey = keyof typeof BUCKETS;

let redis: Redis | null = null;
let configChecked = false;

function getRedis(): Redis | null {
  if (configChecked) return redis;
  configChecked = true;
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    redis = null;
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
}

const limiters = new Map<RateBucketKey, Ratelimit>();

function getLimiter(key: RateBucketKey): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;
  const cached = limiters.get(key);
  if (cached) return cached;
  const cfg = BUCKETS[key];
  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(cfg.limit, cfg.window),
    analytics: false,
    prefix: cfg.prefix,
  });
  limiters.set(key, limiter);
  return limiter;
}

export interface RateLimitResult {
  /** True when the request is allowed through */
  ok: boolean;
  /** Seconds until the bucket resets (only set when ok=false) */
  retryAfter?: number;
  /** True when no limiter is configured — request was allowed by default */
  disabled?: boolean;
}

/**
 * Check whether the caller may proceed. Identity is the rate-key — pass
 * `userId ?? ip`. When no Redis is configured the call returns ok:true
 * with disabled:true (visible in logs) so we don't take the site down on
 * missing env.
 */
export async function checkRateLimit(
  bucket: RateBucketKey,
  identity: string,
): Promise<RateLimitResult> {
  const limiter = getLimiter(bucket);
  if (!limiter) return { ok: true, disabled: true };
  try {
    const r = await limiter.limit(identity);
    if (r.success) return { ok: true };
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)),
    };
  } catch {
    // Network or auth error against Upstash — fail-open so a bad Redis
    // doesn't take the API down. We've already paid the latency.
    return { ok: true, disabled: true };
  }
}
