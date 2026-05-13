import {
  fetchOutfits,
  fetchTopCreators,
  fetchEngagementForViewer,
  fetchFollowingFeed,
} from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { pickBgs, HERO_POOL } from "@/lib/session-background";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const followingPromise = user
    ? fetchFollowingFeed(user.id, 12)
    : Promise.resolve([]);

  const [outfits, creators, [heroBg, lifestyleBg], following] =
    await Promise.all([
      fetchOutfits(12),
      fetchTopCreators(6),
      pickBgs(["home-hero", "home-lifestyle"], HERO_POOL),
      followingPromise,
    ]);

  const allIds = Array.from(
    new Set([...outfits.map((o) => o.id), ...following.map((o) => o.id)]),
  );
  const { liked, saved } = await fetchEngagementForViewer(allIds);

  return (
    <HomeClient
      outfits={outfits}
      following={following}
      creators={creators}
      likedIds={Array.from(liked)}
      savedIds={Array.from(saved)}
      heroBg={heroBg}
      lifestyleBg={lifestyleBg}
    />
  );
}
