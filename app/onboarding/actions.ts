"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isReservedUsername } from "@/lib/reserved-usernames";
import { sendEmail } from "@/lib/email/client";
import { welcomeEmail } from "@/lib/email/templates";

export interface OnboardingState {
  error?: string;
  fieldErrors?: { username?: string };
}

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du måste logga in först." };

  const username = ((formData.get("username") as string | null) ?? "")
    .trim()
    .toLowerCase();
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const metaName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    "";
  const displayName =
    ((formData.get("display_name") as string | null) ?? "").trim() ||
    metaName ||
    null;
  const followIdsRaw = (formData.get("follow_ids") as string | null) ?? "[]";

  if (!USERNAME_RE.test(username)) {
    return {
      fieldErrors: {
        username:
          "3–24 tecken: små bokstäver, siffror, understreck. Inga mellanslag.",
      },
    };
  }

  if (isReservedUsername(username)) {
    return {
      fieldErrors: {
        username: "Det användarnamnet är reserverat — välj ett annat.",
      },
    };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { fieldErrors: { username: "Användarnamnet är upptaget." } };
  }

  // Read existing profile state so we can tell if this is the first
  // onboarding (i.e. should we send the welcome mail) vs. a re-entry.
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const isFirstOnboarding = !currentProfile?.display_name;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ username, display_name: displayName })
    .eq("id", user.id);

  if (profileError) {
    return { error: `Kunde inte spara profilen: ${profileError.message}` };
  }

  let followIds: string[] = [];
  try {
    const parsed = JSON.parse(followIdsRaw);
    if (Array.isArray(parsed)) followIds = parsed.filter((x) => typeof x === "string");
  } catch {
    /* ignore */
  }

  if (followIds.length > 0) {
    await supabase.from("follows").insert(
      followIds
        .filter((id) => id !== user.id)
        .map((id) => ({ follower_id: user.id, followee_id: id })),
    );
  }

  // Best-effort welcome email — only on first onboarding. Fail-soft.
  if (isFirstOnboarding && user.email) {
    const tpl = welcomeEmail({
      displayName: displayName ?? username,
      username,
    });
    await sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    }).catch(() => {});
  }

  redirect("/upptack");
}
