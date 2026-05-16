// POST /api/admin/seo-backfill
//
// Admin-only. AI-genererar SEO-meta för outfits som saknar fält.
// Body: { onlyMissing?: boolean, overwriteTitle?: boolean, ids?: string[] }
//   - onlyMissing (default true): bara outfits där description/meta/keywords/alt är NULL
//   - overwriteTitle (default true): skriv över title med Claude:s förslag — användbart
//     när existerande title är 1-3 ord ("Casual", "Sporty", brand-produktnamn osv)
//   - ids: om angivet, processa bara dessa
//
// För varje outfit:
//   - Hämtar image_url, kallar generateOutfitMeta (Claude vision)
//   - Uppdaterar title (om overwriteTitle), description, meta_description,
//     keywords, alt_text, category
// Returnerar { processed: [{id, title, status}], errors: [{id, error}] }.

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isCurrentUserAdmin } from "@/lib/admin";
import {
  generateOutfitMeta,
  OUTFIT_CATEGORIES,
  type OutfitCategory,
} from "@/lib/ai/generateOutfitMeta";

const MAX_BATCH = 30;

interface OutfitRow {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  alt_text: string | null;
  image_url: string;
}

function service() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false } });
}

function hasComplete(o: OutfitRow): boolean {
  return (
    !!o.description &&
    !!o.meta_description &&
    !!o.keywords &&
    o.keywords.length > 0 &&
    !!o.alt_text
  );
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Inte behörig." }, { status: 403 });
  }

  let body: {
    onlyMissing?: unknown;
    overwriteTitle?: unknown;
    ids?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const onlyMissing = body.onlyMissing !== false; // default true
  const overwriteTitle = body.overwriteTitle !== false; // default true
  const explicitIds = Array.isArray(body.ids)
    ? body.ids.filter((x): x is string => typeof x === "string")
    : null;

  const supabase = service();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server env saknas." },
      { status: 503 },
    );
  }

  let query = supabase
    .from("outfits")
    .select(
      "id, title, category, description, meta_description, keywords, alt_text, image_url",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(MAX_BATCH);
  if (explicitIds && explicitIds.length > 0) {
    query = query.in("id", explicitIds);
  }
  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let candidates = (data ?? []) as OutfitRow[];
  if (onlyMissing && !explicitIds) {
    candidates = candidates.filter((o) => !hasComplete(o));
  }

  const processed: Array<{ id: string; title: string; new_title: string }> = [];
  const errors: Array<{ id: string; error: string }> = [];

  for (const o of candidates) {
    try {
      const meta = await generateOutfitMeta(
        o.image_url,
        (o.category as string | null) ?? null,
      );

      const update: Record<string, unknown> = {
        description: meta.meta_description, // använd som synlig beskrivning också
        meta_description: meta.meta_description,
        keywords: meta.keywords,
        alt_text: meta.alt_text,
      };
      if (overwriteTitle) {
        update.title = meta.title;
      }
      if (
        OUTFIT_CATEGORIES.includes(meta.category as OutfitCategory) &&
        (!o.category || o.category.trim() === "")
      ) {
        update.category = meta.category;
      }

      const { error: upErr } = await supabase
        .from("outfits")
        .update(update)
        .eq("id", o.id);

      if (upErr) {
        errors.push({ id: o.id, error: upErr.message });
        continue;
      }
      processed.push({
        id: o.id,
        title: o.title,
        new_title: overwriteTitle ? meta.title : o.title,
      });
    } catch (e) {
      errors.push({
        id: o.id,
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
