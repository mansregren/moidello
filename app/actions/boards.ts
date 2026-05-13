"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type BoardUpdate = Database["public"]["Tables"]["boards"]["Update"];

export interface BoardActionResult {
  ok: boolean;
  boardId?: string;
  error?: string;
  fieldErrors?: { name?: string };
}

export async function createBoard(
  _prev: BoardActionResult,
  formData: FormData,
): Promise<BoardActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inte inloggad" };

  const name = ((formData.get("name") as string | null) ?? "").trim();
  const description =
    ((formData.get("description") as string | null) ?? "").trim() || null;
  const isPublic = formData.get("is_public") === "on" || formData.get("is_public") === "true";

  if (name.length < 1) {
    return { ok: false, fieldErrors: { name: "Skriv ett namn." } };
  }
  if (name.length > 80) {
    return { ok: false, fieldErrors: { name: "För långt namn (max 80)." } };
  }

  const { data, error } = await supabase
    .from("boards")
    .insert({
      user_id: user.id,
      name,
      description,
      is_public: isPublic,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Kunde inte skapa board." };
  }

  revalidatePath("/profil/boards");
  return { ok: true, boardId: data.id };
}

export async function updateBoard(
  boardId: string,
  patch: { name?: string; description?: string | null; isPublic?: boolean },
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const update: BoardUpdate = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.isPublic !== undefined) update.is_public = patch.isPublic;

  const { error } = await supabase
    .from("boards")
    .update(update)
    .eq("id", boardId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/profil/boards");
  revalidatePath(`/board/${boardId}`);
  return { ok: true };
}

export async function deleteBoard(
  boardId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("boards").delete().eq("id", boardId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/profil/boards");
  return { ok: true };
}

export async function toggleOutfitOnBoard(
  boardId: string,
  outfitId: string,
): Promise<{ ok: boolean; added: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, added: false, error: "Inte inloggad" };

  const { data: existing } = await supabase
    .from("board_outfits")
    .select("board_id")
    .eq("board_id", boardId)
    .eq("outfit_id", outfitId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("board_outfits")
      .delete()
      .eq("board_id", boardId)
      .eq("outfit_id", outfitId);
    if (error) return { ok: false, added: false, error: error.message };
    revalidatePath(`/board/${boardId}`);
    return { ok: true, added: false };
  }

  const { error } = await supabase
    .from("board_outfits")
    .insert({ board_id: boardId, outfit_id: outfitId });
  if (error) return { ok: false, added: false, error: error.message };
  revalidatePath(`/board/${boardId}`);
  return { ok: true, added: true };
}
