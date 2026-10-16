import { brandSlug, canonicalBrand } from "@/lib/brands";
import { PUBLIC_GENDER } from "@/lib/flags";
import type { createPublicClient } from "@/lib/supabase/public";

type PublicClient = ReturnType<typeof createPublicClient>;

/**
 * The same piece tagged in several outfits gets one /produkt/<id> per tag —
 * near-identical pages. One id per (brand, name) is the canonical page: the
 * sitemap lists only those, and the others point their canonical at it.
 */
export function productKey(brand: string, name: string): string {
  return `${brandSlug(canonicalBrand(brand))}|${name.trim().toLowerCase()}`;
}

/** Indexable product pages: public outfit, a buy link and a real name. */
export async function fetchCanonicalProducts(
  supabase: PublicClient,
): Promise<Map<string, string>> {
  let query = supabase
    .from("tagged_items")
    .select("id, brand, name, buy_url, outfits!inner(gender, is_published, vertical)")
    .eq("is_active", true)
    .eq("outfits.is_published", true)
    .eq("outfits.vertical", "mode");
  if (PUBLIC_GENDER) query = query.eq("outfits.gender", PUBLIC_GENDER);
  const { data } = await query.limit(10000);

  const canonical = new Map<string, string>();
  for (const r of (data ?? []) as Array<{ id: string; brand: string; name: string; buy_url: string | null }>) {
    if (!r.buy_url?.trim() || (r.name?.trim().length ?? 0) < 3) continue;
    const key = productKey(r.brand, r.name);
    const current = canonical.get(key);
    if (!current || r.id < current) canonical.set(key, r.id);
  }
  return canonical;
}
