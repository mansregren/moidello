// POST /api/admin/tiktok-caption/bulk
//
// Body: { outfitIds: string[] }
// Returnerar EN gemensam { title, description, hashtags } för alla outfits.
// Cachas inte i DB — varje kombination är unik. Använder Claude Sonnet.

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isCurrentUserAdmin } from "@/lib/admin";
import { generateBulkTiktokCaption } from "@/lib/ai/generateTiktokCaption";

const MAX_OUTFITS = 12;

interface OutfitRow {
  id: string;
  title: string;
  category: string | null;
  gender: "dam" | "herr";
  code: string | null;
}

interface TagRow {
  outfit_id: string;
  brand: string;
  name: string;
  garment: string;
  color: string | null;
}

function service() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Inte behörig." }, { status: 403 });
  }

  let body: { outfitIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON." }, { status: 400 });
  }

  if (!Array.isArray(body.outfitIds) || body.outfitIds.length === 0) {
    return NextResponse.json(
      { error: "outfitIds måste vara en array med minst en id." },
      { status: 400 },
    );
  }
  const ids = body.outfitIds
    .filter((x): x is string => typeof x === "string")
    .slice(0, MAX_OUTFITS);
  if (ids.length === 0) {
    return NextResponse.json(
      { error: "Inga giltiga outfitIds." },
      { status: 400 },
    );
  }

  const supabase = service();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server env saknas." },
      { status: 503 },
    );
  }

  const [{ data: outfitData }, { data: tagData }] = await Promise.all([
    supabase
      .from("outfits")
      .select("id, title, category, gender, code")
      .in("id", ids),
    supabase
      .from("tagged_items")
      .select("outfit_id, brand, name, garment, color")
      .in("outfit_id", ids),
  ]);

  const outfits = (outfitData ?? []) as OutfitRow[];
  if (outfits.length === 0) {
    return NextResponse.json(
      { error: "Inga outfits hittades." },
      { status: 404 },
    );
  }

  // Bevara ordningen som klienten skickade in.
  const tagsByOutfit = new Map<string, TagRow[]>();
  for (const t of (tagData ?? []) as TagRow[]) {
    const arr = tagsByOutfit.get(t.outfit_id) ?? [];
    arr.push(t);
    tagsByOutfit.set(t.outfit_id, arr);
  }
  const outfitsById = new Map(outfits.map((o) => [o.id, o]));
  const ordered = ids
    .map((id) => outfitsById.get(id))
    .filter((o): o is OutfitRow => !!o);

  const payload = ordered.map((o) => ({
    title: o.title,
    category: o.category,
    gender: o.gender,
    code: o.code,
    outfitId: o.id,
    tags: (tagsByOutfit.get(o.id) ?? []).map((t) => ({
      brand: t.brand,
      name: t.name,
      garment: t.garment,
      color: t.color,
    })),
  }));

  try {
    const caption = await generateBulkTiktokCaption(payload);
    return NextResponse.json({ caption });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI-fel." },
      { status: 500 },
    );
  }
}
