import type { Outfit, TaggedItem, User } from "@/lib/types";

/**
 * Strip an outfit down to what a grid card (and the client-side search /
 * gender filter around it) actually reads, before it crosses the server →
 * client boundary. Feeds serialise every outfit into the page payload; the
 * full tag rows carry AI descriptions, keywords, alt text, material and
 * per-region buy links, which made /upptack ~460 KB of HTML for 60 cards.
 */
export function toCardOutfit(outfit: Outfit): Outfit {
  const creator: User = {
    id: outfit.creator.id,
    username: outfit.creator.username,
    displayName: outfit.creator.displayName,
    avatar: outfit.creator.avatar,
    bio: "",
    followers: 0,
    following: 0,
    outfitCount: 0,
  };
  const tags: TaggedItem[] = outfit.tags.map((t) => ({
    id: t.id,
    brand: t.brand,
    name: t.name,
    price: t.price,
    currency: t.currency,
    buyUrl: "",
    garment: t.garment,
    x: t.x,
    y: t.y,
    color: t.color ?? null,
  }));
  return {
    ...outfit,
    // Only the search box reads it; cards never render it.
    description: outfit.description?.slice(0, 160) ?? "",
    metaDescription: undefined,
    creator,
    tags,
    comments: [],
  };
}

export function toCardOutfits(outfits: Outfit[]): Outfit[] {
  return outfits.map(toCardOutfit);
}
