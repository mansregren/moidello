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
          name: "Upptäck outfits — Moidello",
          description:
            "Bläddra bland outfits från svenska kreatörer. Filtrera på kön, kategori och plagg. Klicka för att se exakta plagg och var du kan köpa dem.",
          outfits,
        })}
      />
      <UpptackClient outfits={outfits} />
    </>
  );
}
