"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import type { Database } from "@/lib/supabase/database.types";

type OutfitUpdate = Database["public"]["Tables"]["outfits"]["Update"];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Verify that the current request is allowed to manage the given outfit.
 * Owner or admin succeed; anyone else gets rejected. Returns the outfit
 * row (with user_id) on success so the caller can decide what to do.
 */
async function gateOwnerOrAdmin(outfitId: string): Promise<
  | { ok: true; userId: string; outfitId: string }
  | { ok: false; error: string }
> {
  if (!UUID_RE.test(outfitId)) {
    return { ok: false, error: "Ogiltigt id." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Du måste logga in." };

  const { data: outfit } = await supabase
    .from("outfits")
    .select("user_id")
    .eq("id", outfitId)
    .maybeSingle();

  if (!outfit) return { ok: false, error: "Inlägget finns inte." };

  const isOwner = (outfit.user_id as string) === user.id;
  if (isOwner) return { ok: true, userId: user.id, outfitId };

  if (await isCurrentUserAdmin()) {
    return { ok: true, userId: user.id, outfitId };
  }
  return { ok: false, error: "Du har inte rätt att hantera det här inlägget." };
}

export async function setOutfitHidden(
  outfitId: string,
  hidden: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await gateOwnerOrAdmin(outfitId);
  if (!gate.ok) return gate;

  const supabase = await createClient();
  const { error } = await supabase
    .from("outfits")
    .update({ is_hidden: hidden })
    .eq("id", outfitId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/upptack");
  revalidatePath("/trendigt");
  revalidatePath(`/outfit/${outfitId}`);
  return { ok: true };
}

export async function softDeleteOutfit(
  outfitId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await gateOwnerOrAdmin(outfitId);
  if (!gate.ok) return gate;

  const supabase = await createClient();
  const { error } = await supabase
    .from("outfits")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", outfitId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/upptack");
  revalidatePath("/trendigt");
  revalidatePath(`/outfit/${outfitId}`);
  return { ok: true };
}

/**
 * Owner-editable subset of outfit fields. SEO-meta, scheduling, gender and
 * publishing are admin-only (live on /admin/inlagg/[id]); this updates the
 * fields a regular user controls from /profil/inlagg/[id].
 */
export async function updateOwnOutfit(
  outfitId: string,
  patch: {
    title?: string;
    description?: string | null;
    category?: string | null;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await gateOwnerOrAdmin(outfitId);
  if (!gate.ok) return gate;

  const updates: OutfitUpdate = {};
  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (!t) return { ok: false, error: "Titel får inte vara tom." };
    updates.title = t.slice(0, 200);
  }
  if (patch.description !== undefined) {
    const d = patch.description?.trim() ?? null;
    updates.description = d && d.length > 0 ? d.slice(0, 2000) : null;
  }
  if (patch.category !== undefined) {
    const c = patch.category?.trim() ?? null;
    updates.category = c && c.length > 0 ? c : null;
  }

  if (Object.keys(updates).length === 0) return { ok: true };

  const supabase = await createClient();
  const { error } = await supabase
    .from("outfits")
    .update(updates)
    .eq("id", outfitId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/outfit/${outfitId}`);
  revalidatePath(`/profil/inlagg/${outfitId}`);
  revalidatePath("/profil");
  return { ok: true };
}

export async function restoreOutfit(
  outfitId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Admin-only — owners shouldn't be able to undo their own delete since
  // they can't see the row in the first place (deleted_at filters them out
  // via the SELECT policy). Admin keeps the safety net.
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Bara admin kan återställa." };
  }
  if (!UUID_RE.test(outfitId)) return { ok: false, error: "Ogiltigt id." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("outfits")
    .update({ deleted_at: null })
    .eq("id", outfitId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/outfit/${outfitId}`);
  return { ok: true };
}
