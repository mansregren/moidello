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
  const [outfits, creators, [lifestyleBg], categoryCovers] =
    await Promise.all([
      fetchOutfits(12, client),
      fetchTopCreatorsCached(6),
      pickBgs(["home-lifestyle"], HERO_POOL),
      fetchCategoryCovers(client),
    ]);

  // The homepage hero is a fixed image (no rotation) — the lifestyle
  // banner further down still rotates per session.
  const heroBg = "/images/bg/capferrat.webp";

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          path: "/",
          name: "Moidello",
          description:
            "Discover, share and get inspired by outfits. Tag every piece and find where to buy it.",
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
