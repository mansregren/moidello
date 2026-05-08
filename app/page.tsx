import {
  fetchOutfits,
  fetchTopCreators,
  fetchEngagementForViewer,
} from "@/lib/queries";
import { outfits as mockOutfits, users as mockUsers } from "@/lib/data";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [recentDb, creatorsDb] = await Promise.all([
    fetchOutfits(12),
    fetchTopCreators(6),
  ]);

  // Fall back to seed data while the platform is bootstrapping so the home
  // page isn't bare. Once real outfits/creators exist they take priority.
  const outfitsForUI = recentDb.length > 0 ? recentDb : mockOutfits;
  const creatorsForUI =
    creatorsDb.length > 0 ? creatorsDb : mockUsers.slice(0, 6);

  const { liked, saved } = await fetchEngagementForViewer(
    recentDb.map((o) => o.id),
  );

  return (
    <HomeClient
      outfits={outfitsForUI}
      creators={creatorsForUI}
      likedIds={Array.from(liked)}
      savedIds={Array.from(saved)}
    />
  );
}
