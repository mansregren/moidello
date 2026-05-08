import {
  fetchOutfits,
  fetchTopCreators,
  fetchEngagementForViewer,
} from "@/lib/queries";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [outfits, creators] = await Promise.all([
    fetchOutfits(12),
    fetchTopCreators(6),
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
    />
  );
}
