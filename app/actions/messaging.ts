"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

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

  const { data: existing, error: selectError } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_a", a)
    .eq("user_b", b)
    .maybeSingle();

  if (selectError) {
    console.error("[messaging] conversation lookup failed:", selectError);
    return { ok: false, error: selectError.message };
  }

  if (existing) {
    return { ok: true, conversationId: existing.id as string };
  }

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ user_a: a, user_b: b })
    .select("id")
    .single();

  if (error || !created) {
    console.error("[messaging] conversation insert failed:", error);
    return {
      ok: false,
      error: error?.message ?? "Kunde inte starta samtal",
    };
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

  const rl = await checkRateLimit("message", user.id);
  if (!rl.ok) {
    return { ok: false, error: "För många meddelanden. Vänta lite." };
  }

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

  const uniqRecipients = Array.from(new Set(args.recipientIds)).filter(
    (id) => id !== user.id,
  );
  if (uniqRecipients.length === 0)
    return { ok: false, error: "Välj minst en mottagare" };

  const text = (args.message ?? "").trim();
  if (text.length > 4000) return { ok: false, error: "För lång text" };

  const dataPayload =
    args.type === "outfit_share"
      ? { outfit_id: args.refId }
      : { tagged_item_id: args.refId };

  // Batch-fetch existing conversations for all recipient pairs in one query.
  // The canonical key is (lower-uuid, higher-uuid) so we sort each pair.
  type Pair = { recipientId: string; a: string; b: string };
  const pairs: Pair[] = uniqRecipients.map((rid) => {
    const [a, b] = user.id < rid ? [user.id, rid] : [rid, user.id];
    return { recipientId: rid, a, b };
  });

  const otherIds = uniqRecipients;
  const { data: existing } = await supabase
    .from("conversations")
    .select("id, user_a, user_b")
    .or(
      otherIds
        .map(
          (rid) =>
            `and(user_a.eq.${user.id < rid ? user.id : rid},user_b.eq.${user.id < rid ? rid : user.id})`,
        )
        .join(","),
    );

  const existingByKey = new Map<string, string>();
  for (const row of (existing ?? []) as Array<{
    id: string;
    user_a: string;
    user_b: string;
  }>) {
    existingByKey.set(`${row.user_a}:${row.user_b}`, row.id);
  }

  const missingPairs = pairs.filter(
    (p) => !existingByKey.has(`${p.a}:${p.b}`),
  );

  // Batch-insert any missing conversations.
  if (missingPairs.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from("conversations")
      .insert(missingPairs.map((p) => ({ user_a: p.a, user_b: p.b })))
      .select("id, user_a, user_b");
    if (insertError) {
      return { ok: false, error: insertError.message };
    }
    for (const row of (inserted ?? []) as Array<{
      id: string;
      user_a: string;
      user_b: string;
    }>) {
      existingByKey.set(`${row.user_a}:${row.user_b}`, row.id);
    }
  }

  // Batch-insert all messages in one statement.
  const messages = pairs
    .map((p) => existingByKey.get(`${p.a}:${p.b}`))
    .filter((id): id is string => !!id)
    .map((conversation_id) => ({
      conversation_id,
      sender_id: user.id,
      body: text,
      content_type: args.type,
      content_data: dataPayload,
    }));

  if (messages.length === 0) {
    return { ok: false, error: "Kunde inte hitta samtal." };
  }

  const { error: msgError } = await supabase.from("messages").insert(messages);
  if (msgError) return { ok: false, error: msgError.message };

  const lastConversationId = messages[messages.length - 1].conversation_id;
  revalidatePath("/meddelanden");
  revalidatePath(`/meddelanden/${lastConversationId}`);
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
