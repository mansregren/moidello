import { fetchOutfits, fetchEngagementForViewer } from "@/lib/queries";
import { outfits as mockOutfits } from "@/lib/data";
import UpptackClient from "./UpptackClient";

export const dynamic = "force-dynamic";

export default async function UpptackPage() {
  const dbOutfits = await fetchOutfits();
  // Fall back to mock data while the platform is empty so the feed isn't bare.
  const outfits = dbOutfits.length > 0 ? dbOutfits : mockOutfits;
  const { liked, saved } =
    dbOutfits.length > 0
      ? await fetchEngagementForViewer(dbOutfits.map((o) => o.id))
      : { liked: new Set<string>(), saved: new Set<string>() };
  return (
    <UpptackClient
      outfits={outfits}
      likedIds={Array.from(liked)}
      savedIds={Array.from(saved)}
    />
  );
}
