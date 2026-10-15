import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxySession(request: NextRequest) {
  const hasBgSeed = !!request.cookies.get("moidello_bg_seed");
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

  // Anonymous visitor (the vast majority, plus every crawler): there is no
  // session to refresh, so skip building a Supabase client on every
  // request — this proxy runs in front of even the CDN-cached pages.
  if (!hasAuthCookie && hasBgSeed) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  if (!hasAuthCookie) {
    setBgSeed(response);
    return response;
  }

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

  if (!hasBgSeed) setBgSeed(response);

  return response;
}

// Seed for stable per-session background image rotation. Sticks until the
// browser drops cookies (~1 year) so the same person doesn't see jarring
// hero changes between page navigations.
function setBgSeed(response: NextResponse) {
  const seed = Math.floor(Math.random() * 100000).toString();
  response.cookies.set("moidello_bg_seed", seed, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    path: "/",
  });
}
