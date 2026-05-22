import {
  fetchHomePosts,
  fetchHomeCategoryCovers,
  fetchEngagementForViewer,
} from "@/lib/queries";
import { pickBgs, HERO_POOL } from "@/lib/session-background";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd } from "@/lib/json-ld";
import HomeVerticalClient from "./HomeVerticalClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Heminredning – inred med stil | Moidello",
  description:
    "Inred hemmet med stil. Upptäck vardagsrum, sovrum och kök – tagga varje möbel och hitta var du köper den.",
  alternates: { canonical: "/home" },
};

export default async function HomeVerticalPage() {
  const [posts, categoryCovers, [heroBg]] = await Promise.all([
    fetchHomePosts(24),
    fetchHomeCategoryCovers(),
    pickBgs(["home-vertical-hero"], HERO_POOL),
  ]);

  const { liked, saved } = await fetchEngagementForViewer(
    posts.map((p) => p.id),
  );

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          path: "/home",
          name: "Moidello Home – heminredning",
          description:
            "Inred hemmet med stil. Upptäck rum, tagga varje möbel och hitta var du köper den.",
          outfits: posts,
        })}
      />
      <HomeVerticalClient
        posts={posts}
        categoryCovers={categoryCovers}
        likedIds={Array.from(liked)}
        savedIds={Array.from(saved)}
        heroBg={heroBg}
      />
    </>
  );
}
