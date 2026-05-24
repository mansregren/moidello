"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { fetchFollowingFeed } from "@/lib/queries";
import type { Outfit } from "@/lib/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

/**
 * All outfit IDs the current viewer has liked + saved. Returned as arrays of
 * ids (cheap) so the client can hydrate engagement state without the page
 * having to fetch it server-side — which is what lets public pages be
 * statically/ISR cached instead of force-dynamic. Empty when logged out.
 */
/**
 * The "from people you follow" feed for the current viewer. Fetched
 * client-side so the homepage's public content can be statically/ISR cached
 * while this personalised section still loads in for logged-in users. Empty
 * when logged out.
 */
export async function getFollowingFeed(limit = 12): Promise<Outfit[]> {
  const { user } = await requireUser();
  if (!user) return [];
  return fetchFollowingFeed(user.id, limit);
}

export async function getViewerEngagement(): Promise<{
  liked: string[];
  saved: string[];
  follows: string[];
}> {
  const { supabase, user } = await requireUser();
  if (!user) return { liked: [], saved: [], follows: [] };
  const [likesRes, savesRes, followsRes] = await Promise.all([
    supabase.from("likes").select("outfit_id").eq("user_id", user.id),
    supabase.from("saves").select("outfit_id").eq("user_id", user.id),
    supabase.from("follows").select("followee_id").eq("follower_id", user.id),
  ]);
  return {
    liked: (likesRes.data ?? []).map((r) => r.outfit_id as string),
    saved: (savesRes.data ?? []).map((r) => r.outfit_id as string),
    follows: (followsRes.data ?? []).map((r) => r.followee_id as string),
  };
}

export async function toggleLike(outfitId: string): Promise<EngagementResult> {
  if (!UUID_RE.test(outfitId)) {
    return { ok: false, active: false, error: "Ogiltigt id." };
  }
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, active: false, error: "Inte inloggad" };

  const rl = await checkRateLimit("like", user.id);
  if (!rl.ok) {
    return { ok: false, active: false, error: "För många klick. Vänta lite." };
  }

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
  if (!UUID_RE.test(outfitId)) {
    return { ok: false, active: false, error: "Ogiltigt id." };
  }
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
    // Mirror toggleLike: the save count is shown on the (ISR-cached) outfit
    // page, so invalidate it or new visitors see a stale count.
    revalidatePath(`/outfit/${outfitId}`);
    return { ok: true, active: false };
  }

  const { error } = await supabase
    .from("saves")
    .insert({ user_id: user.id, outfit_id: outfitId });
  if (error) return { ok: false, active: false, error: error.message };
  revalidatePath(`/outfit/${outfitId}`);
  return { ok: true, active: true };
}

export async function toggleFollow(
  followeeId: string,
): Promise<EngagementResult> {
  if (!UUID_RE.test(followeeId)) {
    return { ok: false, active: false, error: "Ogiltigt id." };
  }
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
  if (!UUID_RE.test(outfitId)) {
    return { ok: false, error: "Ogiltigt id." };
  }
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Inte inloggad" };

  const rl = await checkRateLimit("comment", user.id);
  if (!rl.ok) {
    return { ok: false, error: "För många kommentarer. Vänta lite." };
  }

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

export async function deleteComment(
  commentId: string,
  outfitId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!UUID_RE.test(commentId) || !UUID_RE.test(outfitId)) {
    return { ok: false, error: "Ogiltigt id." };
  }
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Inte inloggad" };

  // RLS gates: comment author OR outfit owner. We don't need to
  // duplicate the check here.
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/outfit/${outfitId}`);
  return { ok: true };
}
