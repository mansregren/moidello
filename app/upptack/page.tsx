import { fetchOutfits, fetchEngagementForViewer } from "@/lib/queries";
import UpptackClient from "./UpptackClient";

export const dynamic = "force-dynamic";

export default async function UpptackPage() {
  const outfits = await fetchOutfits();
  const { liked, saved } =
    outfits.length > 0
      ? await fetchEngagementForViewer(outfits.map((o) => o.id))
      : { liked: new Set<string>(), saved: new Set<string>() };
  return (
    <UpptackClient
      outfits={outfits}
      likedIds={Array.from(liked)}
      savedIds={Array.from(saved)}
    />
  );
}
