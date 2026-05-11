// Internal webhook for delivering Web Push messages. Called either by:
//   1. A Supabase Database Webhook on INSERT into public.notifications, or
//   2. A pg_net.http_post from inside the notify_on_* triggers.
//
// Authenticates with a shared secret in the X-Push-Secret header so the
// route can't be abused as a free push-spam relay.
//
// Body shape:
//   { user_id: string, title: string, body: string, url?: string, tag?: string }

import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

interface SubRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface NotifyBody {
  user_id: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function POST(request: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  const provided = request.headers.get("x-push-secret");
  if (!secret || provided !== secret) {
    return new NextResponse("Forbidden", { status: 403 });
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

  if (!payload.user_id || !payload.title) {
    return NextResponse.json(
      { ok: false, error: "Missing fields" },
      { status: 400 },
    );
  }

  // Service-role client bypasses RLS so we can read subscriptions for any
  // user without an active session — required for server-triggered push.
  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false },
  });

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", payload.user_id);

  const list = (subs ?? []) as SubRow[];
  if (list.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    tag: payload.tag,
  });

  let sent = 0;
  await Promise.all(
    list.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
        );
        sent++;
      } catch (err: unknown) {
        const e = err as { statusCode?: number };
        // 404/410 = endpoint dead, drop it so we don't keep retrying.
        if (e.statusCode === 404 || e.statusCode === 410) {
          await admin
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
        }
      }
    }),
  );

  return NextResponse.json({ ok: true, sent });
}
