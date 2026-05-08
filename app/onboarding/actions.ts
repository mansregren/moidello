"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  const displayName =
    ((formData.get("display_name") as string | null) ?? "").trim() || null;
  const followIdsRaw = (formData.get("follow_ids") as string | null) ?? "[]";

  if (!USERNAME_RE.test(username)) {
    return {
      fieldErrors: {
        username:
          "3–24 tecken: små bokstäver, siffror, understreck. Inga mellanslag.",
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

  redirect("/upptack");
}
