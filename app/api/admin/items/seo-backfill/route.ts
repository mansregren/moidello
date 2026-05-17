// POST /api/admin/items/seo-backfill
//
// Admin-only. AI-genererar SEO-meta för tagged_items som saknar fält.
// Body: { onlyMissing?: boolean, ids?: string[], limit?: number }
//   - onlyMissing (default true): bara items där description/keywords/alt_text är NULL
//   - ids: om angivet, processa bara dessa
//   - limit (default 30, max 80): tak per anrop så Vercel-timeouten håller
//
// För varje item:
//   - Bygger PromptInput från brand/name/garment/color/retailer/price + outfit-kontext
//   - Kallar generateItemMeta (Claude text-only)
//   - Uppdaterar description/keywords/alt_text/material
// Returnerar { processed: [{id, brand, name}], errors: [{id, error}] }.

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isCurrentUserAdmin } from "@/lib/admin";
import { generateItemMeta } from "@/lib/ai/generateItemMeta";

const DEFAULT_BATCH = 30;
const MAX_BATCH = 80;

interface ItemRow {
  id: string;
  brand: string;
  name: string;
  garment: string;
  color: string | null;
  retailer: string | null;
  price: number | null;
  currency: string | null;
  description: string | null;
  keywords: string[] | null;
  alt_text: string | null;
  material: string | null;
  outfits: {
    title: string | null;
    category: string | null;
  } | null;
}

function service() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false } });
}

function hasComplete(o: ItemRow): boolean {
  return (
    !!o.description &&
    !!o.keywords &&
    o.keywords.length > 0 &&
    !!o.alt_text
  );
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Inte behörig." }, { status: 403 });
  }

  let body: { onlyMissing?: unknown; ids?: unknown; limit?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const onlyMissing = body.onlyMissing !== false;
  const explicitIds = Array.isArray(body.ids)
    ? body.ids.filter((x): x is string => typeof x === "string")
    : null;
  const requestedLimit =
    typeof body.limit === "number" && body.limit > 0
      ? Math.min(MAX_BATCH, Math.floor(body.limit))
      : DEFAULT_BATCH;

  const supabase = service();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server env saknas (SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 },
    );
  }

  let query = supabase
    .from("tagged_items")
    .select(
      `id, brand, name, garment, color, retailer, price, currency,
       description, keywords, alt_text, material,
       outfits ( title, category )`,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(requestedLimit);
  if (explicitIds && explicitIds.length > 0) {
    query = query.in("id", explicitIds);
  }
  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let candidates = (data ?? []) as unknown as ItemRow[];
  if (onlyMissing && !explicitIds) {
    candidates = candidates.filter((o) => !hasComplete(o));
  }

  const processed: Array<{ id: string; brand: string; name: string }> = [];
  const errors: Array<{ id: string; error: string }> = [];

  for (const it of candidates) {
    try {
      const meta = await generateItemMeta({
        brand: it.brand,
        name: it.name,
        garment: it.garment,
        color: it.color,
        retailer: it.retailer,
        price: it.price,
        currency: it.currency,
        outfitTitle: it.outfits?.title ?? null,
        outfitCategory: it.outfits?.category ?? null,
      });

      const update: Record<string, unknown> = {
        description: meta.description,
        keywords: meta.keywords,
        alt_text: meta.alt_text,
      };
      // Only overwrite material if Claude was sure and we don't already
      // have one. material is a guess from the product name — preserve a
      // human-set value if it ever lands on the table.
      if (meta.material && !it.material) {
        update.material = meta.material;
      }

      const { error: upErr } = await supabase
        .from("tagged_items")
        .update(update)
        .eq("id", it.id);

      if (upErr) {
        errors.push({ id: it.id, error: upErr.message });
        continue;
      }
      processed.push({ id: it.id, brand: it.brand, name: it.name });
    } catch (e) {
      errors.push({
        id: it.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    processed,
    errors,
    total_candidates: candidates.length,
  });
}
