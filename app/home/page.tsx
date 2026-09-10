import { notFound } from "next/navigation";
import {
  fetchHomePosts,
  fetchHomeCategoryCovers,
  fetchEngagementForViewer,
} from "@/lib/queries";
import { pickBgs, HERO_POOL } from "@/lib/session-background";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd } from "@/lib/json-ld";
import { isCurrentUserAdmin } from "@/lib/admin";
import { HOME_VERTICAL_PUBLIC, homeVerticalVisible } from "@/lib/flags";
import HomeVerticalClient from "./HomeVerticalClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Home interiors – decorate with style | Moidello",
  description:
    "Decorate your home with style. Discover living rooms, bedrooms and kitchens – tag every piece of furniture and find where to buy it.",
  alternates: { canonical: "/home" },
  // Unlaunched → keep it out of the index even if someone links to it.
  robots: HOME_VERTICAL_PUBLIC ? undefined : { index: false, follow: false },
};

export default async function HomeVerticalPage() {
  // Admin-only until launch. Public visitors get a 404, not a teaser.
  if (!homeVerticalVisible(await isCurrentUserAdmin())) notFound();

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
          name: "Moidello Home – interiors",
          description:
            "Decorate your home with style. Discover rooms, tag every piece of furniture and find where to buy it.",
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
