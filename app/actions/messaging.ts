"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface MessagingResult {
  ok: boolean;
  error?: string;
  conversationId?: string;
}

export interface ShareRecipient {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

/**
 * Returns the canonical conversation between the current user and the
 * given other user, creating one if it doesn't exist. user_a is always
 * the lower-uuid participant so we maintain a single row per pair.
 */
export async function getOrCreateConversation(
  otherUserId: string,
): Promise<MessagingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inte inloggad" };
  if (user.id === otherUserId)
    return { ok: false, error: "Du kan inte meddela dig själv" };

  const [a, b] =
    user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id];

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_a", a)
    .eq("user_b", b)
    .maybeSingle();

  if (existing) {
    return { ok: true, conversationId: existing.id as string };
  }

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ user_a: a, user_b: b })
    .select("id")
    .single();

  if (error || !created) {
    return { ok: false, error: error?.message ?? "Kunde inte starta samtal" };
  }
  return { ok: true, conversationId: created.id as string };
}

export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<MessagingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inte inloggad" };

  const trimmed = body.trim();
  if (trimmed.length === 0) return { ok: false, error: "Skriv något." };
  if (trimmed.length > 4000)
    return { ok: false, error: "För långt meddelande (max 4000 tecken)." };

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: trimmed,
    content_type: "text",
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/meddelanden/${conversationId}`);
  revalidatePath("/meddelanden");
  return { ok: true, conversationId };
}

/**
 * Send a rich share — either an outfit or an item — to one or more
 * recipients. Auto-creates the conversation if missing. Returns the last
 * conversation id for navigation.
 */
export async function sendShare(args: {
  recipientIds: string[];
  type: "outfit_share" | "item_share";
  refId: string;
  message?: string;
}): Promise<MessagingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inte inloggad" };
  if (args.recipientIds.length === 0)
    return { ok: false, error: "Välj minst en mottagare" };

  const text = (args.message ?? "").trim();
  if (text.length > 4000) return { ok: false, error: "För lång text" };

  const dataPayload =
    args.type === "outfit_share"
      ? { outfit_id: args.refId }
      : { tagged_item_id: args.refId };

  let lastConversationId: string | undefined;

  for (const recipientId of args.recipientIds) {
    if (recipientId === user.id) continue;
    const conv = await getOrCreateConversation(recipientId);
    if (!conv.ok || !conv.conversationId) continue;

    const { error } = await supabase.from("messages").insert({
      conversation_id: conv.conversationId,
      sender_id: user.id,
      body: text,
      content_type: args.type,
      content_data: dataPayload,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    lastConversationId = conv.conversationId;
  }

  revalidatePath("/meddelanden");
  if (lastConversationId) {
    revalidatePath(`/meddelanden/${lastConversationId}`);
  }
  return { ok: true, conversationId: lastConversationId };
}

/**
 * Returns people the current user can DM: union of who they follow and
 * who follows them, minus self. Used by the share modal.
 */
export async function fetchShareRecipients(): Promise<ShareRecipient[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [following, followers] = await Promise.all([
    supabase.from("follows").select("followee_id").eq("follower_id", user.id),
    supabase.from("follows").select("follower_id").eq("followee_id", user.id),
  ]);

  const ids = new Set<string>();
  for (const r of following.data ?? []) ids.add(r.followee_id as string);
  for (const r of followers.data ?? []) ids.add(r.follower_id as string);
  ids.delete(user.id);

  if (ids.size === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", Array.from(ids));

  return (profiles ?? []).map((p) => ({
    id: p.id as string,
    username: p.username as string,
    displayName: (p.display_name as string | null) ?? (p.username as string),
    avatarUrl: (p.avatar_url as string | null) ?? null,
  }));
}

/**
 * Mark all messages in this conversation that were sent by the OTHER party
 * as read. RLS already restricts updates to the recipient.
 */
export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  revalidatePath("/meddelanden");
}
