import {
  fetchOutfits,
  fetchTopCreators,
  fetchEngagementForViewer,
} from "@/lib/queries";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [recentDb, creatorsDb] = await Promise.all([
    fetchOutfits(12),
    fetchTopCreators(6),
  ]);

  const { liked, saved } = await fetchEngagementForViewer(
    recentDb.map((o) => o.id),
  );

  return (
    <HomeClient
      outfits={recentDb}
      creators={creatorsDb}
      likedIds={Array.from(liked)}
      savedIds={Array.from(saved)}
    />
  );
}
