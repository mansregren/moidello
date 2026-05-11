import {
  fetchOutfits,
  fetchTopCreators,
  fetchEngagementForViewer,
} from "@/lib/queries";
import { pickBgs, HERO_POOL } from "@/lib/session-background";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [outfits, creators, [heroBg, lifestyleBg]] = await Promise.all([
    fetchOutfits(12),
    fetchTopCreators(6),
    pickBgs(["home-hero", "home-lifestyle"], HERO_POOL),
  ]);

  const { liked, saved } = await fetchEngagementForViewer(
    outfits.map((o) => o.id),
  );

  return (
    <HomeClient
      outfits={outfits}
      creators={creators}
      likedIds={Array.from(liked)}
      savedIds={Array.from(saved)}
      heroBg={heroBg}
      lifestyleBg={lifestyleBg}
    />
  );
}
