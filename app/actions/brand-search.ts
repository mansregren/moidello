"use server";

import { createClient } from "@/lib/supabase/server";

export interface BrandProductHit {
  id: string;
  brand_key: string;
  name: string;
  price: number | null;
  currency: string | null;
  buy_url: string | null;
  image_url: string | null;
}

/**
 * Search brand_products for autocomplete in /skapa's tag form. Matches
 * brand_key (the lower-cased brand_name) or product name; brand prefix
 * hits rank first because that's how creators usually search.
 */
export async function searchBrandProducts(
  query: string,
  limit = 8,
): Promise<BrandProductHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const supabase = await createClient();
  const pattern = `%${q.replace(/[%_]/g, "\\$&")}%`;
  const prefixPattern = `${q.toLowerCase().replace(/[%_]/g, "\\$&")}%`;

  // First: brand prefix matches (faster + more relevant).
  const { data: brandHits } = await supabase
    .from("brand_products")
    .select("id, brand_key, name, price, currency, buy_url, image_url")
    .ilike("brand_key", prefixPattern)
    .eq("is_active", true)
    .limit(limit);

  let results = (brandHits ?? []) as BrandProductHit[];

  // If brand prefix didn't fill the quota, fall back to name search.
  if (results.length < limit) {
    const remaining = limit - results.length;
    const seenIds = new Set(results.map((r) => r.id));
    const { data: nameHits } = await supabase
      .from("brand_products")
      .select("id, brand_key, name, price, currency, buy_url, image_url")
      .ilike("name", pattern)
      .eq("is_active", true)
      .limit(remaining * 2);
    for (const r of (nameHits ?? []) as BrandProductHit[]) {
      if (!seenIds.has(r.id)) {
        results.push(r);
        if (results.length >= limit) break;
      }
    }
  }

  return results;
}
