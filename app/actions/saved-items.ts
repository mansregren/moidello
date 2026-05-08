"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SavedItemResult {
  ok: boolean;
  saved: boolean;
  error?: string;
}

export async function toggleSavedItem(
  taggedItemId: string,
): Promise<SavedItemResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, saved: false, error: "Inte inloggad" };

  const { data: existing } = await supabase
    .from("saved_items")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("tagged_item_id", taggedItemId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("saved_items")
      .delete()
      .eq("user_id", user.id)
      .eq("tagged_item_id", taggedItemId);
    if (error) return { ok: false, saved: true, error: error.message };
    revalidatePath("/profil");
    return { ok: true, saved: false };
  }

  const { error } = await supabase
    .from("saved_items")
    .insert({ user_id: user.id, tagged_item_id: taggedItemId });
  if (error) return { ok: false, saved: false, error: error.message };
  revalidatePath("/profil");
  return { ok: true, saved: true };
}
