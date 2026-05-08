import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  const { error: exchangeError, data: exchangeData } =
    await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError || !exchangeData.user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // New users have an auto-generated username starting with "user_". Send them
  // to onboarding to pick a real one before landing on the feed.
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", exchangeData.user.id)
    .maybeSingle();

  if (profile?.username?.startsWith("user_")) {
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  return NextResponse.redirect(`${origin}${next ?? "/upptack"}`);
}
