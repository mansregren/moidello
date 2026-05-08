import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const supabase = await createClient();

  let userId: string | null = null;

  // Cross-device safe: server-side OTP verification with the email link's
  // token_hash. Doesn't depend on PKCE cookies, so it works when the user
  // clicks the magic link in a different webview/browser than the one that
  // requested it.
  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error && data.user) {
      userId = data.user.id;
    }
  } else if (code) {
    // Same-device PKCE flow.
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      userId = data.user.id;
    }
  }

  if (!userId) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.username?.startsWith("user_")) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  return NextResponse.redirect(`${origin}${next ?? "/upptack"}`);
}
