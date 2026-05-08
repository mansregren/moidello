import { fetchOutfits } from "@/lib/queries";
import { outfits as mockOutfits } from "@/lib/data";
import UpptackClient from "./UpptackClient";

export const dynamic = "force-dynamic";

export default async function UpptackPage() {
  const dbOutfits = await fetchOutfits();
  // Fall back to mock data while the platform is empty so the feed isn't bare.
  const outfits = dbOutfits.length > 0 ? dbOutfits : mockOutfits;
  return <UpptackClient outfits={outfits} />;
}
