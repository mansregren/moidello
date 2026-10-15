// POST /api/admin/catalog-import
//
// Machine import into the plaggbank, for curated batches prepared outside
// the browser (e.g. a hand-picked packshot per product). Same pipeline as
// saveCatalogDraft: download → normalise to WebP → upload to
// outfits/catalog/ → insert catalog_items.
//
// Auth: `Authorization: Bearer <CATALOG_IMPORT_TOKEN>`. If the env var is
// unset the route answers 404, so it is off unless explicitly configured.
// Body: { drafts: CatalogDraft-like[] } (max 25 per call).
// Returns { results: [{ url, ok, id?, error? }] }.

import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { downloadImage, storeCatalogImage } from "@/lib/catalog/image";
import { catalogUrlKey, cleanBuyUrl } from "@/lib/catalog/guess";
import type { Database } from "@/lib/supabase/database.types";

type CatalogInsert = Database["public"]["Tables"]["catalog_items"]["Insert"];

const MAX_PER_CALL = 25;

function authorised(request: Request): boolean {
  const expected = process.env.CATALOG_IMPORT_TOKEN;
  if (!expected) return false;
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function str(v: unknown, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Server env missing." }, { status: 503 });
  }
  const supabase = createServiceClient<Database>(url, key, {
    auth: { persistSession: false },
  });

  let body: { drafts?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const drafts = Array.isArray(body.drafts) ? body.drafts.slice(0, MAX_PER_CALL) : [];
  if (drafts.length === 0) {
    return NextResponse.json({ error: "No drafts." }, { status: 400 });
  }

  // Rows are attributed to the (first) admin account.
  const { data: admin } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const results: Array<{ url: string; ok: boolean; id?: string; error?: string }> = [];
  for (const raw of drafts as Array<Record<string, unknown>>) {
    const buyUrl = str(raw.url, 2000);
    const brand = str(raw.brand, 120);
    const name = str(raw.name, 200);
    const garment = str(raw.garment, 40);
    const image = str(raw.sourceImageUrl, 2000);
    if (!/^https?:\/\//i.test(buyUrl) || !brand || !name || !garment || !image) {
      results.push({ url: buyUrl, ok: false, error: "Missing url/brand/name/garment/image." });
      continue;
    }
    let stored: Awaited<ReturnType<typeof storeCatalogImage>>;
    try {
      stored = await storeCatalogImage(
        // Same storage calls as the cookie client; the service client
        // bypasses RLS, which the admin storage policy would allow anyway.
        supabase as unknown as Parameters<typeof storeCatalogImage>[0],
        await downloadImage(image),
      );
    } catch (e) {
      results.push({ url: buyUrl, ok: false, error: e instanceof Error ? e.message : "Image error." });
      continue;
    }
    const price = Number(raw.price);
    const row: CatalogInsert = {
      brand,
      name,
      garment,
      gender: raw.gender === "herr" || raw.gender === "dam" ? raw.gender : null,
      color: str(raw.color, 40) || null,
      material: str(raw.material, 60) || null,
      price: raw.price !== null && raw.price !== "" && Number.isFinite(price) && price >= 0
        ? Math.round(price * 100) / 100
        : null,
      currency: str(raw.currency, 8).toUpperCase() || "SEK",
      buy_url: cleanBuyUrl(buyUrl).slice(0, 2000),
      url_key: catalogUrlKey(buyUrl),
      image_url: stored.publicUrl,
      image_path: stored.path,
      image_bg: stored.background,
      source_image_url: image,
      retailer: str(raw.retailer, 64) || null,
      retailer_locale: null,
      is_affiliate: false,
      affiliate_network: null,
      created_by: admin?.id ?? null,
    } as CatalogInsert;
    const { data, error } = await supabase
      .from("catalog_items")
      .insert(row)
      .select("id")
      .single();
    if (error || !data) {
      await supabase.storage.from("outfits").remove([stored.path]);
      results.push({
        url: buyUrl,
        ok: false,
        error: error?.code === "23505" ? "Already in the plaggbank." : error?.message ?? "Insert failed.",
      });
      continue;
    }
    results.push({ url: buyUrl, ok: true, id: data.id as string });
  }
  revalidatePath("/admin/plagg");
  return NextResponse.json({ results });
}
