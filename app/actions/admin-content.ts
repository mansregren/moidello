"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_BULK = 100;

export async function updateOutfit(
  outfitId: string,
  patch: {
    title?: string;
    description?: string | null;
    meta_description?: string | null;
    keywords?: string[] | null;
    alt_text?: string | null;
    category?: string | null;
    gender?: "dam" | "herr";
    is_published?: boolean;
    scheduled_for?: string | null;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Inte behörig." };
  }
  if (!UUID_RE.test(outfitId)) {
    return { ok: false, error: "Ogiltigt id." };
  }

  const updates: Record<
    string,
    string | string[] | boolean | null
  > = {};
  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (!t) return { ok: false, error: "Titel får inte vara tom." };
    updates.title = t.slice(0, 200);
  }
  if (patch.description !== undefined) {
    const d = patch.description?.trim() ?? null;
    updates.description = d && d.length > 0 ? d.slice(0, 2000) : null;
  }
  if (patch.meta_description !== undefined) {
    const m = patch.meta_description?.trim() ?? null;
    if (m && m.length > 200) {
      return { ok: false, error: "Meta-description max 200 tecken." };
    }
    updates.meta_description = m && m.length > 0 ? m : null;
  }
  if (patch.keywords !== undefined) {
    if (patch.keywords === null) {
      updates.keywords = null;
    } else {
      const cleaned = patch.keywords
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length > 0)
        .slice(0, 10);
      updates.keywords = cleaned.length > 0 ? cleaned : null;
    }
  }
  if (patch.alt_text !== undefined) {
    const a = patch.alt_text?.trim() ?? null;
    if (a && a.length > 400) {
      return { ok: false, error: "Alt-text max 400 tecken." };
    }
    updates.alt_text = a && a.length > 0 ? a : null;
  }
  if (patch.category !== undefined) {
    const c = patch.category?.trim() ?? null;
    updates.category = c && c.length > 0 ? c : null;
  }
  if (patch.gender !== undefined) {
    if (patch.gender !== "dam" && patch.gender !== "herr") {
      return { ok: false, error: "Ogiltigt kön." };
    }
    updates.gender = patch.gender;
  }
  if (patch.is_published !== undefined) {
    updates.is_published = patch.is_published;
  }
  if (patch.scheduled_for !== undefined) {
    if (patch.scheduled_for === null) {
      updates.scheduled_for = null;
    } else {
      const d = new Date(patch.scheduled_for);
      if (Number.isNaN(d.getTime())) {
        return { ok: false, error: "Ogiltigt schemaläggnings-datum." };
      }
      updates.scheduled_for = d.toISOString();
    }
  }

  if (Object.keys(updates).length === 0) return { ok: true };

  const supabase = await createClient();
  const { error } = await supabase
    .from("outfits")
    .update(updates)
    .eq("id", outfitId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/inlagg");
  revalidatePath(`/admin/inlagg/${outfitId}`);
  revalidatePath(`/outfit/${outfitId}`);
  return { ok: true };
}

export async function deleteOutfit(
  outfitId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Inte behörig." };
  }
  if (!UUID_RE.test(outfitId)) {
    return { ok: false, error: "Ogiltigt id." };
  }

  const supabase = await createClient();

  // Best-effort: remove the storage object too. Fail-open if it errors.
  const { data: row } = await supabase
    .from("outfits")
    .select("image_path")
    .eq("id", outfitId)
    .maybeSingle();
  if (row?.image_path) {
    await supabase.storage
      .from("outfits")
      .remove([row.image_path as string]);
  }

  const { error } = await supabase
    .from("outfits")
    .delete()
    .eq("id", outfitId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/inlagg");
  return { ok: true };
}

export async function addTaggedItem(
  outfitId: string,
  data: {
    brand: string;
    name: string;
    buy_url: string;
    price?: number | null;
    currency?: string | null;
    color?: string | null;
    image_url?: string | null;
    retailer?: string | null;
    retailer_locale?: string | null;
    is_affiliate?: boolean;
    affiliate_network?: string | null;
    garment?: string;
    cached_metadata?: Record<string, unknown> | null;
  },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Inte behörig." };
  }
  if (!UUID_RE.test(outfitId)) {
    return { ok: false, error: "Ogiltigt outfit-id." };
  }
  const brand = data.brand.trim();
  const name = data.name.trim();
  const buyUrl = data.buy_url.trim();
  if (!brand || !name) {
    return { ok: false, error: "Märke och plaggnamn måste fyllas i." };
  }
  if (!/^https?:\/\//i.test(buyUrl)) {
    return { ok: false, error: "Köp-URL måste börja med http(s)://" };
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("tagged_items")
    .insert({
      outfit_id: outfitId,
      brand: brand.slice(0, 80),
      name: name.slice(0, 200),
      buy_url: buyUrl.slice(0, 2000),
      price: data.price ?? null,
      currency: (data.currency ?? "SEK").toUpperCase().slice(0, 8),
      color: data.color?.trim().slice(0, 40) || null,
      image_url: data.image_url?.trim().slice(0, 1000) || null,
      retailer: data.retailer?.trim().slice(0, 64) || null,
      retailer_locale: data.retailer_locale?.trim().slice(0, 8) || null,
      is_affiliate: !!data.is_affiliate,
      affiliate_network:
        data.affiliate_network?.trim().slice(0, 32) || null,
      garment: data.garment?.slice(0, 40) || "Toppar",
      cached_metadata: data.cached_metadata ?? null,
      last_fetched_at: new Date().toISOString(),
      // Required NOT NULL legacy columns:
      position_x: 50,
      position_y: 50,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/inlagg/${outfitId}`);
  revalidatePath(`/outfit/${outfitId}`);
  return { ok: true, id: row.id as string };
}

export async function updateTaggedItem(
  tagId: string,
  patch: {
    brand?: string;
    name?: string;
    buy_url?: string | null;
    price?: number | null;
    currency?: string | null;
    color?: string | null;
    image_url?: string | null;
    garment?: string;
    is_affiliate?: boolean;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Inte behörig." };
  }
  if (!UUID_RE.test(tagId)) return { ok: false, error: "Ogiltigt id." };

  const updates: Record<string, string | number | boolean | null> = {};
  if (patch.brand !== undefined) {
    const b = patch.brand.trim();
    if (!b) return { ok: false, error: "Märke får inte vara tomt." };
    updates.brand = b.slice(0, 80);
  }
  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (!n) return { ok: false, error: "Namn får inte vara tomt." };
    updates.name = n.slice(0, 200);
  }
  if (patch.buy_url !== undefined) {
    const u = patch.buy_url?.trim() ?? null;
    if (u && !/^https?:\/\//i.test(u)) {
      return { ok: false, error: "URL måste börja med http(s)://" };
    }
    updates.buy_url = u && u.length > 0 ? u : null;
  }
  if (patch.price !== undefined) {
    if (patch.price === null) {
      updates.price = null;
    } else {
      const p = Number(patch.price);
      if (!Number.isFinite(p) || p < 0) {
        return { ok: false, error: "Ogiltigt pris." };
      }
      updates.price = p;
    }
  }
  if (patch.currency !== undefined) {
    const c = patch.currency?.trim().toUpperCase() ?? null;
    updates.currency = c && c.length > 0 ? c.slice(0, 8) : null;
  }
  if (patch.color !== undefined) {
    const c = patch.color?.trim() ?? null;
    updates.color = c && c.length > 0 ? c.slice(0, 40) : null;
  }
  if (patch.image_url !== undefined) {
    const u = patch.image_url?.trim() ?? null;
    updates.image_url = u && u.length > 0 ? u.slice(0, 1000) : null;
  }
  if (patch.garment !== undefined) {
    updates.garment = patch.garment.slice(0, 40);
  }
  if (patch.is_affiliate !== undefined) {
    updates.is_affiliate = patch.is_affiliate;
  }

  if (Object.keys(updates).length === 0) return { ok: true };

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("tagged_items")
    .update(updates)
    .eq("id", tagId)
    .select("outfit_id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };

  if (row?.outfit_id) {
    revalidatePath(`/admin/inlagg/${row.outfit_id}`);
  }
  return { ok: true };
}

export async function bulkPublishOutfits(
  outfitIds: string[],
  publish: boolean,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Inte behörig." };
  }
  const valid = outfitIds.filter((id) => UUID_RE.test(id)).slice(0, MAX_BULK);
  if (valid.length === 0) return { ok: false, error: "Inga giltiga ID." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("outfits")
    .update({ is_published: publish, scheduled_for: null })
    .in("id", valid);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/inlagg");
  return { ok: true, count: valid.length };
}

export async function bulkDeleteOutfits(
  outfitIds: string[],
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Inte behörig." };
  }
  const valid = outfitIds.filter((id) => UUID_RE.test(id)).slice(0, MAX_BULK);
  if (valid.length === 0) return { ok: false, error: "Inga giltiga ID." };

  const supabase = await createClient();

  // Best-effort storage cleanup so we don't leak blobs.
  const { data: rows } = await supabase
    .from("outfits")
    .select("image_path")
    .in("id", valid);
  const paths = ((rows ?? []) as Array<{ image_path: string | null }>)
    .map((r) => r.image_path)
    .filter((p): p is string => !!p);
  if (paths.length > 0) {
    await supabase.storage.from("outfits").remove(paths);
  }

  const { error } = await supabase.from("outfits").delete().in("id", valid);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/inlagg");
  return { ok: true, count: valid.length };
}

export async function bulkReassignOutfits(
  outfitIds: string[],
  newUserId: string,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Inte behörig." };
  }
  if (!UUID_RE.test(newUserId)) {
    return { ok: false, error: "Ogiltig mål-användare." };
  }
  const valid = outfitIds.filter((id) => UUID_RE.test(id)).slice(0, MAX_BULK);
  if (valid.length === 0) return { ok: false, error: "Inga giltiga ID." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("outfits")
    .update({ user_id: newUserId })
    .in("id", valid);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/inlagg");
  return { ok: true, count: valid.length };
}

export async function updateTaggedItemPosition(
  tagId: string,
  x: number,
  y: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Inte behörig." };
  }
  if (!UUID_RE.test(tagId)) return { ok: false, error: "Ogiltigt id." };

  const clamp = (v: number) =>
    Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : null;
  const px = clamp(x);
  const py = clamp(y);
  if (px === null || py === null) {
    return { ok: false, error: "Ogiltig position." };
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("tagged_items")
    .update({ position_x: px, position_y: py })
    .eq("id", tagId)
    .select("outfit_id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };

  if (row?.outfit_id) {
    revalidatePath(`/admin/inlagg/${row.outfit_id}`);
    revalidatePath(`/outfit/${row.outfit_id}`);
  }
  return { ok: true };
}

export async function deleteTaggedItem(
  tagId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Inte behörig." };
  }
  if (!UUID_RE.test(tagId)) return { ok: false, error: "Ogiltigt id." };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("tagged_items")
    .select("outfit_id")
    .eq("id", tagId)
    .maybeSingle();

  const { error } = await supabase
    .from("tagged_items")
    .delete()
    .eq("id", tagId);
  if (error) return { ok: false, error: error.message };

  if (row?.outfit_id) {
    revalidatePath(`/admin/inlagg/${row.outfit_id}`);
  }
  return { ok: true };
}
