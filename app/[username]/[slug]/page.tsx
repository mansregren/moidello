import { notFound, permanentRedirect } from "next/navigation";
import {
  fetchOutfitBySlug,
  fetchOutfits,
  fetchHomePosts,
  fetchOutfitComments,
} from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { isReservedUsername } from "@/lib/reserved-usernames";
import OutfitDetail from "@/app/outfit/[id]/OutfitDetail";

// ISR: outfit detail is public content. Liked/saved, follow, saved-products
// and admin controls hydrate client-side; buy links route through /go which
// resolves the viewer's region at click. Public client → no cookies → static.
export const dynamic = "force-static";
export const revalidate = 300;

export default async function OutfitPageBySlug({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;

  // Defence-in-depth: a reserved name should never reach this route since
  // signup blocks it, but if one slipped in we'd rather 404 than serve.
  if (isReservedUsername(username)) notFound();

  // Canonicalize username casing.
  if (username !== username.toLowerCase()) {
    permanentRedirect(`/${username.toLowerCase()}/${slug}`);
  }

  const client = createPublicClient();
  const outfit = await fetchOutfitBySlug(username, slug, client);
  if (!outfit) notFound();

  const isHome = outfit.vertical === "hem";
  const [pool, comments] = await Promise.all([
    // Pull "similar" from the same vertical — a home post must never
    // surface fashion outfits (its gender is a "dam" fallback).
    isHome ? fetchHomePosts(20, client) : fetchOutfits(20, client),
    fetchOutfitComments(outfit.id),
  ]);

  const similar = (
    isHome
      ? pool.filter((o) => o.id !== outfit.id)
      : pool.filter((o) => o.id !== outfit.id && o.gender === outfit.gender)
  ).slice(0, 3);

  return (
    <OutfitDetail outfit={{ ...outfit, comments }} similar={similar} isPersisted />
  );
}
