import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role client. Bypasses RLS entirely — use only inside admin-
 * gated server actions, never expose to client code. Reads
 * SUPABASE_SERVICE_ROLE_KEY from the environment; throws if not configured
 * so callers fail loudly instead of silently fronting the anon key.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY missing — set it in Vercel env to enable admin user creation/deletion.",
    );
  }
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}
