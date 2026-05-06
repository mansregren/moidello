import type { Region, TaggedItem } from "./types";

/** Default region when none is detected or set. */
export const DEFAULT_REGION: Region = "SE";

/**
 * Resolve which buy URL to show for a given tagged item, preferring the
 * region-specific URL when one exists, falling back to the default.
 */
export function resolveBuyUrl(
  tag: TaggedItem,
  region: Region = DEFAULT_REGION
): string {
  if (tag.buyUrls) {
    if (tag.buyUrls[region]) return tag.buyUrls[region];
    if (tag.buyUrls[DEFAULT_REGION]) return tag.buyUrls[DEFAULT_REGION];
    const first = Object.values(tag.buyUrls)[0];
    if (first) return first;
  }
  return tag.buyUrl;
}
