import { fetchOutfits, fetchEngagementForViewer } from "@/lib/queries";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd } from "@/lib/json-ld";
import UpptackClient from "./UpptackClient";

export const dynamic = "force-dynamic";

export default async function UpptackPage() {
  const outfits = await fetchOutfits();
  const { liked, saved } =
    outfits.length > 0
      ? await fetchEngagementForViewer(outfits.map((o) => o.id))
      : { liked: new Set<string>(), saved: new Set<string>() };
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
      <UpptackClient
        outfits={outfits}
        likedIds={Array.from(liked)}
        savedIds={Array.from(saved)}
      />
    </>
  );
}
