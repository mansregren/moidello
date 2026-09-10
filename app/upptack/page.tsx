import { fetchOutfits } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd } from "@/lib/json-ld";
import UpptackClient from "./UpptackClient";

// ISR: the outfit feed is identical for everyone — gender filtering and
// liked/saved state are applied client-side — so cache it and refresh in the
// background instead of hitting Supabase per request. Public client reads no
// cookies, keeping the render static.
export const dynamic = "force-static";
export const revalidate = 300;

export default async function UpptackPage() {
  const outfits = await fetchOutfits(60, createPublicClient());
  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          path: "/upptack",
          name: "Discover outfits — Moidello",
          description:
            "Browse outfits and filter by category and garment. Click to see the exact pieces and where to buy them.",
          outfits,
        })}
      />
      <UpptackClient outfits={outfits} />
    </>
  );
}
