"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface EngagementResult {
  ok: boolean;
  active: boolean;
  error?: string;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function toggleLike(outfitId: string): Promise<EngagementResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, active: false, error: "Inte inloggad" };

  const { data: existing } = await supabase
    .from("likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("outfit_id", outfitId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("outfit_id", outfitId);
    revalidatePath(`/outfit/${outfitId}`);
    return { ok: true, active: false };
  }

  const { error } = await supabase
    .from("likes")
    .insert({ user_id: user.id, outfit_id: outfitId });
  if (error) return { ok: false, active: false, error: error.message };
  revalidatePath(`/outfit/${outfitId}`);
  return { ok: true, active: true };
}

export async function toggleSave(outfitId: string): Promise<EngagementResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, active: false, error: "Inte inloggad" };

  const { data: existing } = await supabase
    .from("saves")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("outfit_id", outfitId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("saves")
      .delete()
      .eq("user_id", user.id)
      .eq("outfit_id", outfitId);
    return { ok: true, active: false };
  }

  const { error } = await supabase
    .from("saves")
    .insert({ user_id: user.id, outfit_id: outfitId });
  if (error) return { ok: false, active: false, error: error.message };
  return { ok: true, active: true };
}

export async function toggleFollow(
  followeeId: string,
): Promise<EngagementResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, active: false, error: "Inte inloggad" };
  if (user.id === followeeId)
    return { ok: false, active: false, error: "Kan inte följa dig själv" };

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("followee_id", followeeId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followee_id", followeeId);
    return { ok: true, active: false };
  }

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, followee_id: followeeId });
  if (error) return { ok: false, active: false, error: error.message };
  return { ok: true, active: true };
}

export async function postComment(
  outfitId: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Inte inloggad" };

  const trimmed = body.trim();
  if (trimmed.length === 0)
    return { ok: false, error: "Skriv något." };
  if (trimmed.length > 1000)
    return { ok: false, error: "För lång kommentar (max 1000 tecken)." };

  const { error } = await supabase
    .from("comments")
    .insert({ outfit_id: outfitId, user_id: user.id, body: trimmed });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/outfit/${outfitId}`);
  return { ok: true };
}
