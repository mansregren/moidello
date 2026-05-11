"use server";

import { createClient } from "@/lib/supabase/server";

type TargetType = "outfit" | "comment" | "profile";
type Reason =
  | "spam"
  | "harassment"
  | "inappropriate"
  | "misinformation"
  | "impersonation"
  | "copyright"
  | "other";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function submitReport(input: {
  targetType: TargetType;
  targetId: string;
  reason: Reason;
  body?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!UUID_RE.test(input.targetId)) {
    return { ok: false, error: "Ogiltigt id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Du måste vara inloggad." };

  const body = input.body?.trim() ?? "";
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    body: body.length > 0 ? body.slice(0, 2000) : null,
  });

  if (error) {
    return { ok: false, error: "Kunde inte skicka rapport." };
  }
  return { ok: true };
}
