import { createClient } from "@/lib/supabase/server";

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
