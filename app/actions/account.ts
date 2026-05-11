"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface DataExport {
  exported_at: string;
  user_id: string;
  profile: unknown;
  outfits: unknown;
  tagged_items: unknown;
  comments: unknown;
  likes: unknown;
  saves: unknown;
  saved_items: unknown;
  follows_followers: unknown;
  follows_following: unknown;
  boards: unknown;
  board_outfits: unknown;
  conversations: unknown;
  messages: unknown;
  notifications: unknown;
}

export async function exportMyData(): Promise<
  { ok: true; data: DataExport } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inte inloggad." };

  // One round-trip per table. The shape is intentionally raw — this dump
  // is for the user, not for re-import.
  const [
    profile,
    outfits,
    taggedItems,
    comments,
    likes,
    saves,
    savedItems,
    followers,
    following,
    boards,
    boardOutfits,
    conversations,
    messages,
    notifications,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("outfits").select("*").eq("user_id", user.id),
    supabase
      .from("tagged_items")
      .select("*, outfits!inner(user_id)")
      .eq("outfits.user_id", user.id),
    supabase.from("comments").select("*").eq("user_id", user.id),
    supabase.from("likes").select("*").eq("user_id", user.id),
    supabase.from("saves").select("*").eq("user_id", user.id),
    supabase.from("saved_items").select("*").eq("user_id", user.id),
    supabase.from("follows").select("*").eq("followee_id", user.id),
    supabase.from("follows").select("*").eq("follower_id", user.id),
    supabase.from("boards").select("*").eq("user_id", user.id),
    supabase
      .from("board_outfits")
      .select("*, boards!inner(user_id)")
      .eq("boards.user_id", user.id),
    supabase
      .from("conversations")
      .select("*")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
    supabase.from("messages").select("*").eq("sender_id", user.id),
    supabase.from("notifications").select("*").eq("recipient_id", user.id),
  ]);

  return {
    ok: true,
    data: {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      profile: profile.data,
      outfits: outfits.data ?? [],
      tagged_items: taggedItems.data ?? [],
      comments: comments.data ?? [],
      likes: likes.data ?? [],
      saves: saves.data ?? [],
      saved_items: savedItems.data ?? [],
      follows_followers: followers.data ?? [],
      follows_following: following.data ?? [],
      boards: boards.data ?? [],
      board_outfits: boardOutfits.data ?? [],
      conversations: conversations.data ?? [],
      messages: messages.data ?? [],
      notifications: notifications.data ?? [],
    },
  };
}

export async function deleteMyAccount(
  confirmation: string,
): Promise<{ ok: false; error: string }> {
  // Deliberate guard: client passes the user's exact username so a stray
  // click cannot wipe the account.
  if (!confirmation || confirmation.length < 1) {
    return { ok: false, error: "Bekräftelse saknas." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inte inloggad." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.username !== confirmation) {
    return { ok: false, error: "Användarnamnet matchar inte." };
  }

  // Cascading FKs on profiles remove outfits, comments, follows, saves,
  // boards, messages, notifications, reports etc. The auth.users row
  // itself stays — a future cron can sweep orphans, or admin tooling can
  // call auth.admin.deleteUser. Without service_role we can't do it from
  // here. The user can no longer log in (no profile = onboarding loop
  // would catch them), but for now we sign them out and they're gone
  // from the app's POV.
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: "Kunde inte radera kontot." };
  }

  await supabase.auth.signOut();
  redirect("/");
}
