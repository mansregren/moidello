// POST /api/admin/posts/bulk-draft-from-images
//
// Admin-only. Takes 1–20 images + a per-image assignment array, uploads
// each image, asks Claude to generate SEO meta, and writes the result as
// draft outfits owned by the assigned user. Robust per-image — one bad
// image doesn't kill the rest.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { slugify, storageFilename } from "@/lib/slug";
import {
  generateOutfitMeta,
  OUTFIT_CATEGORIES,
  type OutfitCategory,
} from "@/lib/ai/generateOutfitMeta";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_BATCH = 20;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Assignment {
  user_id: string;
  category_hint?: string | null;
  gender?: "dam" | "herr";
}

interface DraftResult {
  index: number;
  id: string;
  user_id: string;
  title: string;
  slug: string | null;
  edit_url: string;
  status: "draft";
}

interface DraftError {
  index: number;
  user_id?: string;
  error: string;
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json(
      { error: "Inte behörig." },
      { status: 403 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ogiltig request." }, { status: 400 });
  }

  const images = formData.getAll("images").filter((f): f is File => f instanceof File);
  if (images.length === 0) {
    return NextResponse.json({ error: "Inga bilder." }, { status: 400 });
  }
  if (images.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Max ${MAX_BATCH} bilder per batch.` },
      { status: 400 },
    );
  }

  const assignmentsRaw = formData.get("assignments");
  if (typeof assignmentsRaw !== "string") {
    return NextResponse.json(
      { error: "Saknar assignments-array." },
      { status: 400 },
    );
  }
  let assignments: Assignment[];
  try {
    const parsed = JSON.parse(assignmentsRaw);
    if (!Array.isArray(parsed)) throw new Error();
    assignments = parsed as Assignment[];
  } catch {
    return NextResponse.json(
      { error: "Ogiltig assignments-JSON." },
      { status: 400 },
    );
  }
  if (assignments.length !== images.length) {
    return NextResponse.json(
      { error: "assignments-arrayen måste matcha antal bilder." },
      { status: 400 },
    );
  }

  // Validate each assignment up-front so we can report errors before
  // starting any expensive Claude calls.
  const drafts: DraftResult[] = [];
  const errors: DraftError[] = [];

  const supabase = await createClient();

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const a = assignments[i];

    if (!a || !UUID_RE.test(a.user_id)) {
      errors.push({ index: i, error: "Ogiltigt user_id." });
      continue;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
      errors.push({
        index: i,
        user_id: a.user_id,
        error: "Bilden måste vara JPG, PNG eller WebP.",
      });
      continue;
    }
    if (image.size > MAX_IMAGE_BYTES) {
      errors.push({
        index: i,
        user_id: a.user_id,
        error: "Bilden är för stor (max 10 MB).",
      });
      continue;
    }

    const gender = a.gender === "herr" ? "herr" : "dam";
    const categoryHint =
      a.category_hint &&
      OUTFIT_CATEGORIES.includes(a.category_hint as OutfitCategory)
        ? a.category_hint
        : null;

    // 1. Upload the image first so Claude has a stable URL to read from.
    const ext = image.name.split(".").pop()?.toLowerCase() || "jpg";
    const tempSlug = slugify(`seed-${Date.now()}-${i}`);
    const path = storageFilename({
      userId: a.user_id,
      slug: tempSlug,
      ext,
      prefix: "seed",
    });

    const { error: uploadError } = await supabase.storage
      .from("outfits")
      .upload(path, image, {
        contentType: image.type,
        upsert: false,
      });
    if (uploadError) {
      errors.push({
        index: i,
        user_id: a.user_id,
        error: `Bilduppladdning misslyckades: ${uploadError.message}`,
      });
      continue;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("outfits").getPublicUrl(path);

    // 2. Ask Claude for the meta. On any failure, drop the storage blob
    // we just uploaded so we don't leak orphans.
    let meta;
    try {
      meta = await generateOutfitMeta(publicUrl, categoryHint);
    } catch (e) {
      await supabase.storage.from("outfits").remove([path]);
      errors.push({
        index: i,
        user_id: a.user_id,
        error: e instanceof Error ? e.message : "AI-fel.",
      });
      continue;
    }

    // 3. Insert the outfit row. Retry the slug a few times on collision
    // (Claude can produce repeated titles when batches are similar).
    const baseSlug = slugify(meta.title);
    let chosenSlug = baseSlug || "outfit";
    let inserted:
      | { id: string; slug: string | null }
      | null = null;
    let insertError: { code?: string; message?: string } | null = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from("outfits")
        .insert({
          user_id: a.user_id,
          image_url: publicUrl,
          image_path: path,
          title: meta.title,
          slug: chosenSlug,
          description: null,
          meta_description: meta.meta_description,
          keywords: meta.keywords,
          alt_text: meta.alt_text,
          category: meta.category,
          gender,
          type: "photo",
          is_published: false,
          created_by_admin: true,
        })
        .select("id, slug")
        .single();

      if (!error && data) {
        inserted = data as { id: string; slug: string | null };
        insertError = null;
        break;
      }
      if (error?.code === "23505" && attempt < 4) {
        const suffix = Math.random().toString(36).slice(2, 6);
        chosenSlug = `${baseSlug || "outfit"}-${suffix}`;
        insertError = error;
        continue;
      }
      insertError = error ?? null;
      break;
    }

    if (insertError || !inserted) {
      await supabase.storage.from("outfits").remove([path]);
      errors.push({
        index: i,
        user_id: a.user_id,
        error: `DB-fel: ${insertError?.message ?? "okänt"}`,
      });
      continue;
    }

    drafts.push({
      index: i,
      id: inserted.id,
      user_id: a.user_id,
      title: meta.title,
      slug: inserted.slug,
      edit_url: `/admin/inlagg/${inserted.id}`,
      status: "draft",
    });
  }

  return NextResponse.json({ drafts, errors });
}
