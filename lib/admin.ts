import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const IMPERSONATION_COOKIE = "moidello_act_as";

/**
 * Returns true when the current request comes from an admin account.
 * Use as a gate in admin-only server components and server actions.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return !!data?.is_admin;
}

/**
 * If the current request is from an admin AND the impersonation cookie is
 * set, return the target user id. Otherwise null. Use this in content-
 * creation actions (e.g. createOutfit) to write rows as the impersonated
 * user. The double check (admin + cookie) means a stolen cookie alone is
 * useless.
 */
export async function getImpersonationTarget(): Promise<{
  targetUserId: string;
  targetUsername: string | null;
  targetDisplayName: string | null;
} | null> {
  const jar = await cookies();
  const cookieVal = jar.get(IMPERSONATION_COOKIE)?.value;
  if (!cookieVal) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: viewer } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!viewer?.is_admin) return null;

  // Don't let admin impersonate themselves — just a no-op.
  if (cookieVal === user.id) return null;

  const { data: target } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("id", cookieVal)
    .maybeSingle();
  if (!target) return null;

  return {
    targetUserId: target.id,
    targetUsername: (target.username as string | null) ?? null,
    targetDisplayName: (target.display_name as string | null) ?? null,
  };
}
