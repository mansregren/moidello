import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { getRetailerById } from "@/lib/retailers";
import {
  detectLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/geo/detect-locale";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VIEWER_COOKIE = "moidello_viewer";
const VIEWER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type Region = Locale;

/** Map ISO2 (uppercase) → our retailer-locale convention (lowercase). */
function countryToLocale(country: string): string {
  return country.toLowerCase();
}

const DEFAULT_REGION: Region = "SE";

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
    .select(
      "id, buy_url, buy_urls, outfit_id, is_affiliate, retailer, is_active",
    )
    .eq("id", itemId)
    .maybeSingle();

  if (!item || (item as { is_active?: boolean }).is_active === false) {
    return new NextResponse("Not found", { status: 404 });
  }

  const hdrs = await headers();
  const jar = await cookies();
  const detection = detectLocale({
    cookie: jar.get(LOCALE_COOKIE)?.value ?? null,
    acceptLanguage: hdrs.get("accept-language"),
    ipCountry: hdrs.get("x-vercel-ip-country"),
  });
  // INFO-level — we expect this every request. We just want signal in
  // Vercel logs so we can spot Accept-Language-vs-IP disagreements
  // (e.g. Malmö Telia routing via Copenhagen) and tune accordingly.
  console.info(
    `[go] locale=${detection.locale} source=${detection.source} ` +
      `al=${hdrs.get("accept-language") ?? ""} ip=${hdrs.get("x-vercel-ip-country") ?? ""}`,
  );
  const country = detection.locale;
  const region = country;

  let target = pickBuyUrl(
    (item.buy_url as string | null) ?? null,
    (item.buy_urls as Record<string, string> | null) ?? null,
    region,
  );

  if (!target) {
    return new NextResponse("No buy link", { status: 404 });
  }

  // Geo-rewrite when we have a retailer module that supports the visitor's
  // locale — but NEVER for affiliate links. The creator's tracking depends
  // on the exact path/query, so we pass those through untouched.
  if (!item.is_affiliate && item.retailer) {
    const retailer = getRetailerById(item.retailer as string);
    if (retailer) {
      const targetLocale = countryToLocale(country);
      if (retailer.supportedLocales.includes(targetLocale)) {
        try {
          const before = new URL(target);
          const sourceLocale = retailer.detectLocale(before);
          const rewritten = retailer.rewriteForLocale(before, targetLocale);
          // Catch silent rewrite failures: if the source URL was on a
          // different locale than the target but the result is unchanged,
          // something is off (likely an unrecognised segment that should
          // have been swapped — see johnhenric/nelly prepend-bug audit
          // 2026-05-13). Log instead of failing loudly so the user still
          // gets a redirect; we just want monitoring signal.
          if (
            sourceLocale &&
            sourceLocale !== targetLocale &&
            rewritten.toString() === before.toString()
          ) {
            console.warn(
              `[go] rewriteForLocale no-op despite locale mismatch: ` +
                `retailer=${retailer.id} sourceLocale=${sourceLocale} ` +
                `targetLocale=${targetLocale} url=${before.toString()}`,
            );
          }
          target = rewritten.toString();
        } catch (err) {
          // Bad URL or retailer threw — fall through to original target,
          // but log so we don't lose track of broken modules.
          console.warn(
            `[go] rewriteForLocale threw: retailer=${retailer.id} ` +
              `target=${targetLocale} err=${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }
  } else if (!item.is_affiliate) {
    // No retailer set → no geo-rewrite, no allowlist guarantee. Log so we
    // can spot phishing-style buy_urls (S-3 from audit 2026-05-13). Doesn't
    // block — admin still controls what gets saved.
    try {
      const targetHost = new URL(target).hostname;
      console.warn(
        `[go] unknown retailer, passthrough redirect itemId=${itemId} host=${targetHost}`,
      );
    } catch {
      // ignore
    }
  }

  // Log the click best-effort. Skip bots (social preview crawlers, search
  // engines) so creator dashboards aren't inflated by metadata fetches, and
  // skip self-clicks from the outfit owner.
  const userAgent = hdrs.get("user-agent") ?? "";
  const referrer = hdrs.get("referer");

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
        visitor_country: country,
        referrer: referrer ? referrer.slice(0, 500) : null,
        user_agent: userAgent ? userAgent.slice(0, 500) : null,
      });
    }
  }

  // Geo-aware redirects must never be CDN-cached — same item_id can
  // resolve to different URLs depending on visitor's country.
  return new NextResponse(null, {
    status: 302,
    headers: {
      location: target,
      "cache-control": "no-store",
    },
  });
}
