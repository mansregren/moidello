import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxySession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the session cookie. Don't run logic between createServerClient
  // and getClaims — token refresh can race otherwise.
  await supabase.auth.getClaims();

  // Seed for stable per-session background image rotation. Sticks until the
  // browser drops cookies (~1 year) so the same person doesn't see jarring
  // hero changes between page navigations.
  if (!request.cookies.get("moidello_bg_seed")) {
    const seed = Math.floor(Math.random() * 100000).toString();
    response.cookies.set("moidello_bg_seed", seed, {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}
