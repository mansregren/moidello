import { fetchOutfits, fetchCategoryCovers } from "@/lib/queries";
import { fetchTopCreatorsCached } from "@/lib/queries-cached";
import { createPublicClient } from "@/lib/supabase/public";
import { pickBgs, HERO_POOL } from "@/lib/session-background";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd } from "@/lib/json-ld";
import HomeClient from "./HomeClient";

// ISR: the homepage's public content (latest outfits, creators, categories)
// is the same for everyone and is cached + background-refreshed. The
// per-viewer "from people you follow" feed loads client-side in HomeClient.
// Public client → no cookies, so the render stays static.
export const dynamic = "force-static";
export const revalidate = 120;

export const metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const client = createPublicClient();
  const [outfits, creators, [heroBg, lifestyleBg], categoryCovers] =
    await Promise.all([
      fetchOutfits(12, client),
      fetchTopCreatorsCached(6),
      pickBgs(["home-hero", "home-lifestyle"], HERO_POOL),
      fetchCategoryCovers(client),
    ]);

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          path: "/",
          name: "Moidello",
          description:
            "Upptäck, dela och inspireras av outfits. Tagga varje plagg och hitta var du kan köpa det.",
          outfits,
        })}
      />
      <HomeClient
        outfits={outfits}
        creators={creators}
        categoryCovers={categoryCovers}
        heroBg={heroBg}
        lifestyleBg={lifestyleBg}
      />
    </>
  );
}
