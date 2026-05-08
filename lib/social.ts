/**
 * Helpers for normalizing the optional social + contact fields on profiles.
 * The form accepts either a full URL or a bare @handle (or just a handle);
 * these resolvers return the canonical URL we use in <a href>.
 */

function stripAt(handle: string): string {
  return handle.startsWith("@") ? handle.slice(1) : handle;
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function instagramUrl(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (looksLikeUrl(v)) return v;
  return `https://instagram.com/${stripAt(v)}`;
}

export function tiktokUrl(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (looksLikeUrl(v)) return v;
  return `https://www.tiktok.com/@${stripAt(v)}`;
}

export function youtubeUrl(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (looksLikeUrl(v)) return v;
  return `https://www.youtube.com/@${stripAt(v)}`;
}

export function websiteUrl(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (looksLikeUrl(v)) return v;
  return `https://${v}`;
}

export function instagramHandle(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (looksLikeUrl(v)) {
    const m = v.match(/instagram\.com\/(@?[^/?#]+)/i);
    return m ? `@${stripAt(m[1])}` : v;
  }
  return `@${stripAt(v)}`;
}

export function tiktokHandle(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (looksLikeUrl(v)) {
    const m = v.match(/tiktok\.com\/@?([^/?#]+)/i);
    return m ? `@${stripAt(m[1])}` : v;
  }
  return `@${stripAt(v)}`;
}

export function youtubeHandle(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (looksLikeUrl(v)) {
    const m = v.match(/youtube\.com\/(@?[^/?#]+)/i);
    return m ? `@${stripAt(m[1])}` : v;
  }
  return `@${stripAt(v)}`;
}

export function prettyWebsite(value: string): string {
  const v = value.trim();
  if (!v) return "";
  return v.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}
