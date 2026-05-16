// GET = läs cachad caption från DB, generera + spara om saknas
// POST = tvinga regenerera + spara
//
// Admin-only. Använder Claude Sonnet via lib/ai/generateTiktokCaption.

import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isCurrentUserAdmin } from "@/lib/admin";
import {
  generateTiktokCaption,
  type TiktokCaption,
} from "@/lib/ai/generateTiktokCaption";

interface OutfitRow {
  id: string;
  title: string;
  category: string | null;
  gender: "dam" | "herr";
  code: string | null;
  tiktok_caption_json: TiktokCaption | null;
}

interface TagRow {
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

async function loadOutfit(id: string) {
  const supabase = service();
  if (!supabase) return { error: "service-role saknas", status: 503 } as const;

  const { data: outfit, error } = await supabase
    .from("outfits")
    .select("id, title, category, gender, code, tiktok_caption_json")
    .eq("id", id)
    .maybeSingle();
  if (error || !outfit) {
    return { error: "Outfit hittas inte.", status: 404 } as const;
  }

  const { data: tags } = await supabase
    .from("tagged_items")
    .select("brand, name, garment, color")
    .eq("outfit_id", id);

  return { outfit: outfit as OutfitRow, tags: (tags ?? []) as TagRow[] };
}

async function generateAndSave(
  id: string,
  outfit: OutfitRow,
  tags: TagRow[],
): Promise<TiktokCaption> {
  const caption = await generateTiktokCaption({
    title: outfit.title,
    category: outfit.category,
    gender: outfit.gender,
    code: outfit.code,
    tags: tags.map((t) => ({
      brand: t.brand,
      name: t.name,
      garment: t.garment,
      color: t.color,
    })),
  });

  const supabase = service();
  if (supabase) {
    await supabase
      .from("outfits")
      .update({ tiktok_caption_json: caption })
      .eq("id", id);
  }

  return caption;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Inte behörig." }, { status: 403 });
  }
  const { id } = await params;
  const result = await loadOutfit(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const { outfit, tags } = result;

  if (outfit.tiktok_caption_json) {
    return NextResponse.json({ caption: outfit.tiktok_caption_json, cached: true });
  }

  try {
    const caption = await generateAndSave(id, outfit, tags);
    return NextResponse.json({ caption, cached: false });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI-fel." },
      { status: 500 },
    );
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Inte behörig." }, { status: 403 });
  }
  const { id } = await params;
  const result = await loadOutfit(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const { outfit, tags } = result;

  try {
    const caption = await generateAndSave(id, outfit, tags);
    return NextResponse.json({ caption, cached: false });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI-fel." },
      { status: 500 },
    );
  }
}
