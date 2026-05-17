import {
  fetchOutfits,
  fetchEngagementForViewer,
  fetchFollowingFeed,
  fetchCategoryCovers,
  fetchAllColors,
} from "@/lib/queries";
import { fetchTopCreatorsCached } from "@/lib/queries-cached";
import { createClient } from "@/lib/supabase/server";
import { pickBgs, HERO_POOL } from "@/lib/session-background";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd } from "@/lib/json-ld";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export const metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const followingPromise = user
    ? fetchFollowingFeed(user.id, 12)
    : Promise.resolve([]);

  const [
    outfits,
    creators,
    [heroBg, lifestyleBg],
    following,
    categoryCovers,
    colorRows,
  ] = await Promise.all([
    fetchOutfits(12),
    fetchTopCreatorsCached(6),
    pickBgs(["home-hero", "home-lifestyle"], HERO_POOL),
    followingPromise,
    fetchCategoryCovers(),
    fetchAllColors(),
  ]);

  // Top colors by tagged-item count — only include slugs we know lead
  // to non-empty /farg/[slug] pages so the home-row never points at a
  // 404.
  const topColors = colorRows
    .filter((r) => r.count >= 2)
    .slice(0, 12)
    .map((r) => r.color);

  const allIds = Array.from(
    new Set([...outfits.map((o) => o.id), ...following.map((o) => o.id)]),
  );
  const { liked, saved } = await fetchEngagementForViewer(allIds);

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          path: "/",
          name: "Moidello",
          description:
            "Upptäck, dela och inspireras av outfits. Tagga varje plagg och hitta var du kan köpa det.",
          outfits,
        })}
      />
      <HomeClient
        outfits={outfits}
        following={following}
        creators={creators}
        categoryCovers={categoryCovers}
        topColors={topColors}
        likedIds={Array.from(liked)}
        savedIds={Array.from(saved)}
        heroBg={heroBg}
        lifestyleBg={lifestyleBg}
      />
    </>
  );
}
