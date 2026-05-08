"use server";

import { cookies } from "next/headers";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";

const VIEWER_COOKIE = "moidello_viewer";
const VIEWER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

async function getViewerToken(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(VIEWER_COOKIE)?.value;
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  jar.set(VIEWER_COOKIE, fresh, {
    maxAge: VIEWER_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
  });
  return fresh;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function recordOutfitView(outfitId: string): Promise<void> {
  if (!UUID_RE.test(outfitId)) return; // skip mock fixtures

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Don't count self-views — would inflate creators' own dashboards.
  const { data: outfit } = await supabase
    .from("outfits")
    .select("user_id")
    .eq("id", outfitId)
    .maybeSingle();
  if (!outfit) return;
  if (user && outfit.user_id === user.id) return;

  const viewerToken = user?.id ?? (await getViewerToken());

  await supabase.from("outfit_views").insert({
    outfit_id: outfitId,
    viewer_token: viewerToken,
    user_id: user?.id ?? null,
  });
}

export async function recordTagClick(
  tagId: string,
  outfitId: string,
): Promise<void> {
  if (!UUID_RE.test(tagId) || !UUID_RE.test(outfitId)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Skip clicks from the creator on their own outfit.
  const { data: outfit } = await supabase
    .from("outfits")
    .select("user_id")
    .eq("id", outfitId)
    .maybeSingle();
  if (outfit && user && outfit.user_id === user.id) return;

  const viewerToken = user?.id ?? (await getViewerToken());

  await supabase.from("tag_clicks").insert({
    tag_id: tagId,
    outfit_id: outfitId,
    viewer_token: viewerToken,
    user_id: user?.id ?? null,
  });
}
