import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VIEWER_COOKIE = "moidello_viewer";
const VIEWER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type Region = "SE" | "NO" | "DK" | "FI" | "DE" | "GB" | "US";
const DEFAULT_REGION: Region = "SE";

function resolveRegion(): Region {
  // Keep simple for now — could later read Vercel's x-vercel-ip-country header
  // or a user-preference cookie. Falls back to SE since this is a Swedish
  // platform.
  return DEFAULT_REGION;
}

function pickBuyUrl(
  buyUrl: string | null,
  buyUrls: Record<string, string> | null,
  region: Region,
): string | null {
  if (buyUrls && typeof buyUrls === "object") {
    if (buyUrls[region]) return buyUrls[region];
    if (buyUrls[DEFAULT_REGION]) return buyUrls[DEFAULT_REGION];
    const first = Object.values(buyUrls)[0];
    if (first) return first;
  }
  if (buyUrl && buyUrl !== "#" && /^https?:\/\//i.test(buyUrl)) return buyUrl;
  return null;
}

function isBot(userAgent: string): boolean {
  return /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|ahrefs|semrush/i.test(
    userAgent,
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;

  if (!UUID_RE.test(itemId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabase = await createClient();

  const { data: item } = await supabase
    .from("tagged_items")
    .select("id, buy_url, buy_urls, outfit_id")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) {
    return new NextResponse("Not found", { status: 404 });
  }

  const region = resolveRegion();
  const target = pickBuyUrl(
    (item.buy_url as string | null) ?? null,
    (item.buy_urls as Record<string, string> | null) ?? null,
    region,
  );

  if (!target) {
    return new NextResponse("No buy link", { status: 404 });
  }

  // Log the click best-effort. Skip bots (social preview crawlers, search
  // engines) so creator dashboards aren't inflated by metadata fetches, and
  // skip self-clicks from the outfit owner.
  const hdrs = await headers();
  const userAgent = hdrs.get("user-agent") ?? "";

  if (!isBot(userAgent)) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: outfit } = await supabase
      .from("outfits")
      .select("user_id")
      .eq("id", item.outfit_id)
      .maybeSingle();

    const isSelfClick = !!(user && outfit && outfit.user_id === user.id);

    if (!isSelfClick) {
      const jar = await cookies();
      let viewerToken = user?.id ?? jar.get(VIEWER_COOKIE)?.value;
      if (!viewerToken) {
        viewerToken = crypto.randomUUID();
        jar.set(VIEWER_COOKIE, viewerToken, {
          maxAge: VIEWER_COOKIE_MAX_AGE,
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          path: "/",
        });
      }

      await supabase.from("tag_clicks").insert({
        tag_id: item.id,
        outfit_id: item.outfit_id,
        viewer_token: viewerToken,
        user_id: user?.id ?? null,
      });
    }
  }

  return NextResponse.redirect(target, { status: 302 });
}
