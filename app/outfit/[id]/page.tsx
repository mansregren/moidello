import { notFound, permanentRedirect } from "next/navigation";
import {
  fetchOutfitById,
  fetchOutfits,
  fetchHomePosts,
  fetchOutfitComments,
} from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import OutfitDetail from "./OutfitDetail";

// ISR: legacy /outfit/<uuid> route. Real outfits 301 to /<username>/<slug>;
// only slug-less legacy posts render here. Per-viewer state hydrates
// client-side in OutfitDetail, so this can be static too.
export const dynamic = "force-static";
export const revalidate = 300;

export default async function OutfitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = createPublicClient();
  const outfit = await fetchOutfitById(id, client);
  if (!outfit) notFound();

  // Canonical URL is /<username>/<slug>. 301 every legacy /outfit/<uuid>
  // hit so old shared links + Google's existing index roll over to the
  // new structure without a flicker. Backwards-compat for outfits
  // without a slug (legacy/mock) is preserved by the slug guard.
  if (outfit.slug && outfit.creator.username) {
    permanentRedirect(
      `/${outfit.creator.username.toLowerCase()}/${outfit.slug}`,
    );
  }

  const isHome = outfit.vertical === "hem";
  const [pool, comments] = await Promise.all([
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
