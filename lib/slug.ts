/**
 * Slug + short-hash helpers used to give uploaded files descriptive,
 * SEO-friendly names instead of UUIDs. The short hash isn't security-
 * sensitive — it just keeps two uploads with the same slug from
 * colliding in storage.
 */

export function slugify(input: string, max = 60): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    // Strip combining accents (Postgres index pattern is the same)
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, max);
}

/**
 * 6-character base36 hash — non-cryptographic, just enough entropy to
 * avoid collisions when two uploads have the same slug.
 */
export function shortHash(): string {
  // 6 base36 chars ≈ 30 bits ≈ 1 in a billion of duplication
  return Math.random().toString(36).slice(2, 8);
}

/**
 * Build a Supabase storage path keyed under the user's id (required by
 * the storage RLS policy) but with a slug-prefixed filename so search
 * engines + downloaders see something descriptive.
 */
export function storageFilename(parts: {
  userId: string;
  slug: string;
  ext: string;
  prefix?: string;
}): string {
  const base = parts.slug || "moidello";
  const cleanExt = parts.ext.replace(/^\.+/, "").toLowerCase() || "jpg";
  const file = `${parts.prefix ? `${parts.prefix}-` : ""}${base}-${shortHash()}.${cleanExt}`;
  return `${parts.userId}/${file}`;
}
