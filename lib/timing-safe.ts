import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison for secrets. Returns false if either
 * value is missing or if the lengths differ (timingSafeEqual throws on
 * length-mismatch, so we short-circuit cleanly first).
 */
export function timingSafeStringEqual(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
