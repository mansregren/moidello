/**
 * Hosts allowed in next.config `images.remotePatterns`. Images from these
 * go through Next.js image optimisation (resized per viewport, served as
 * WebP); anything else — e.g. a Google profile photo — is rendered as-is,
 * because next/image would reject an unlisted host.
 */
const OPTIMIZABLE_HOSTS = new Set([
  "images.unsplash.com",
  "i.pravatar.cc",
  "cqarmynxrewurcbrrftn.supabase.co",
]);

export function canOptimizeImage(src: string | null | undefined): boolean {
  if (!src) return false;
  if (src.startsWith("/")) return true;
  try {
    return OPTIMIZABLE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}
