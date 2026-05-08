"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface MessagingResult {
  ok: boolean;
  error?: string;
  conversationId?: string;
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

  // Canonical ordering
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
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/meddelanden/${conversationId}`);
  revalidatePath("/meddelanden");
  return { ok: true, conversationId };
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
