// Internal webhook for sending Resend-backed notification emails. Mirrors
// the push notify-route so a single Supabase Database Webhook on
// notifications.INSERT can trigger both channels.
//
// Body shape (matches the push route):
//   { user_id: string, kind: "follow" | "comment" | "message",
//     actor_id?: string, outfit_id?: string, comment_id?: string }
//
// We resolve names + URLs server-side using a service-role client.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/client";
import {
  newCommentEmail,
  newFollowerEmail,
  newMessageEmail,
} from "@/lib/email/templates";

type Kind = "follow" | "comment" | "message";

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
  if (!secret || provided !== secret) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    return NextResponse.json(
      { ok: false, error: "Server env missing" },
      { status: 503 },
    );
  }

  let payload: NotifyBody;
  try {
    payload = (await request.json()) as NotifyBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }

  const admin = createClient(url, serviceRole, {
    auth: { persistSession: false },
  });

  const { data: recipient } = await admin
    .from("profiles")
    .select("id, display_name, username, contact_email")
    .eq("id", payload.user_id)
    .maybeSingle();
  if (!recipient?.contact_email) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no email" });
  }

  const recipientName =
    (recipient.display_name as string | null) ??
    (recipient.username as string);

  let actor: { display_name: string | null; username: string } | null = null;
  if (payload.actor_id) {
    const { data } = await admin
      .from("profiles")
      .select("display_name, username")
      .eq("id", payload.actor_id)
      .maybeSingle();
    if (data) {
      actor = {
        display_name: (data.display_name as string | null) ?? null,
        username: data.username as string,
      };
    }
  }
  if (!actor) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no actor" });
  }
  const actorName = actor.display_name ?? actor.username;

  let template: ReturnType<typeof newFollowerEmail> | null = null;

  if (payload.kind === "follow") {
    template = newFollowerEmail({
      recipientName,
      followerName: actorName,
      followerUsername: actor.username,
    });
  } else if (payload.kind === "comment" && payload.comment_id) {
    const { data: comment } = await admin
      .from("comments")
      .select("body, outfit_id")
      .eq("id", payload.comment_id)
      .maybeSingle();
    if (comment) {
      const { data: outfit } = await admin
        .from("outfits")
        .select("title, slug, user_id, profiles:user_id(username)")
        .eq("id", comment.outfit_id)
        .maybeSingle();
      const username =
        (outfit?.profiles as unknown as { username: string } | null)
          ?.username ?? "";
      const outfitUrl = outfit?.slug
        ? `https://moidello.com/${username}/${outfit.slug}`
        : `https://moidello.com/outfit/${comment.outfit_id}`;
      template = newCommentEmail({
        recipientName,
        commenterName: actorName,
        commentBody: (comment.body as string) ?? "",
        outfitTitle: (outfit?.title as string) ?? "Din outfit",
        outfitUrl,
      });
    }
  } else if (payload.kind === "message") {
    template = newMessageEmail({
      recipientName,
      senderName: actorName,
      senderUsername: actor.username,
    });
  }

  if (!template) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no template" });
  }

  const result = await sendEmail({
    to: recipient.contact_email as string,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return NextResponse.json({ ok: result.ok, error: result.error });
}
