// Internal webhook for delivering Web Push messages. Called either by:
//   1. A Supabase Database Webhook on INSERT into public.notifications, or
//   2. A pg_net.http_post from inside the notify_on_* triggers.
//
// Authenticates with a shared secret in the X-Push-Secret header so the
// route can't be abused as a free push-spam relay.
//
// Body shape (mirrors /api/email/notify so a single trigger payload fits both):
//   { user_id, kind: "like" | "follow" | "comment" | "message",
//     actor_id?, outfit_id?, comment_id? }
// The route resolves human-readable title/body server-side.

import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { timingSafeStringEqual } from "@/lib/timing-safe";
import { checkRateLimit } from "@/lib/rate-limit";

interface SubRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

type Kind = "like" | "follow" | "comment" | "message";

interface NotifyBody {
  user_id: string;
  kind: Kind;
  actor_id?: string;
  outfit_id?: string;
  comment_id?: string;
}

export async function POST(request: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  const provided = request.headers.get("x-push-secret");
  if (!timingSafeStringEqual(provided, secret)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Defence-in-depth: even with the secret, cap deliveries so a runaway
  // Supabase webhook doesn't melt the route. 120/min per caller IP is far
  // above expected steady-state and well under web-push provider limits.
  const ip = request.headers.get("x-forwarded-for") ?? "webhook";
  const rl = await checkRateLimit("webhook", ip);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate limited" },
      {
        status: 429,
        headers: rl.retryAfter
          ? { "retry-after": String(rl.retryAfter) }
          : undefined,
      },
    );
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !vapidPublic ||
    !vapidPrivate ||
    !vapidSubject ||
    !supabaseUrl ||
    !serviceRole
  ) {
    return NextResponse.json(
      { ok: false, error: "Push not configured" },
      { status: 503 },
    );
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  let payload: NotifyBody;
  try {
    payload = (await request.json()) as NotifyBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }

  if (!payload.user_id || !payload.kind) {
    return NextResponse.json(
      { ok: false, error: "Missing fields" },
      { status: 400 },
    );
  }

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false },
  });

  // Resolve actor name for the title — required for all kinds.
  let actorName: string | null = null;
  let actorUsername: string | null = null;
  if (payload.actor_id) {
    const { data } = await admin
      .from("profiles")
      .select("display_name, username")
      .eq("id", payload.actor_id)
      .maybeSingle();
    if (data) {
      const dn = (data.display_name as string | null)?.trim() ?? "";
      const un = (data.username as string | null) ?? null;
      actorName = dn || un;
      actorUsername = un;
    }
  }
  if (!actorName) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no actor" });
  }

  // Resolve outfit URL when relevant.
  let outfitUrl: string | null = null;
  let outfitTitle: string | null = null;
  if (payload.outfit_id) {
    const { data: outfit } = await admin
      .from("outfits")
      .select("title, slug, user_id, profiles:user_id(username)")
      .eq("id", payload.outfit_id)
      .maybeSingle();
    if (outfit) {
      const username =
        (outfit.profiles as unknown as { username: string } | null)
          ?.username ?? "";
      outfitUrl = outfit.slug
        ? `/${username}/${outfit.slug}`
        : `/outfit/${payload.outfit_id}`;
      outfitTitle = (outfit.title as string) ?? null;
    }
  }

  let title: string;
  let body: string;
  let url: string;
  let tag: string;

  switch (payload.kind) {
    case "like":
      title = `${actorName} gillade din outfit`;
      body = outfitTitle ?? "Klicka för att se";
      url = outfitUrl ?? "/";
      tag = `like:${payload.outfit_id}`;
      break;
    case "follow":
      title = `${actorName} följer dig nu`;
      body = "Tryck för att se profilen";
      url = actorUsername ? `/profile/${actorUsername}` : "/";
      tag = `follow:${payload.actor_id}`;
      break;
    case "comment": {
      let snippet = "";
      if (payload.comment_id) {
        const { data: comment } = await admin
          .from("comments")
          .select("body")
          .eq("id", payload.comment_id)
          .maybeSingle();
        snippet = (comment?.body as string | undefined) ?? "";
      }
      title = `${actorName} kommenterade`;
      body = snippet ? snippet.slice(0, 120) : (outfitTitle ?? "Ny kommentar");
      url = outfitUrl ?? "/";
      tag = `comment:${payload.comment_id ?? payload.outfit_id}`;
      break;
    }
    case "message":
      title = `${actorName} skickade ett meddelande`;
      body = "Tryck för att läsa";
      url = "/meddelanden";
      tag = `message:${payload.actor_id}`;
      break;
    default:
      return NextResponse.json(
        { ok: false, error: "Unknown kind" },
        { status: 400 },
      );
  }

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", payload.user_id);

  const list = (subs ?? []) as SubRow[];
  if (list.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const pushBody = JSON.stringify({ title, body, url, tag });

  const results = await Promise.all(
    list.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          pushBody,
        );
        return true;
      } catch (err: unknown) {
        const e = err as { statusCode?: number };
        if (e.statusCode === 404 || e.statusCode === 410) {
          // Prune dead subscriptions, but never let a failed delete reject
          // this callback — that would reject Promise.all and 500 the webhook,
          // triggering endless Supabase retries.
          try {
            await admin.from("push_subscriptions").delete().eq("id", sub.id);
          } catch {
            // ignore — best-effort cleanup
          }
        }
        return false;
      }
    }),
  );

  const sent = results.filter(Boolean).length;
  return NextResponse.json({ ok: true, sent });
}
