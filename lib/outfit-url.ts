/**
 * One source of truth for the canonical outfit URL. The new /<username>/
 * <slug> form is the canonical for any outfit that has both fields;
 * we fall back to /outfit/<id> for older rows that haven't been
 * back-filled or for mock fixtures used in dev/storybook.
 */

import type { Outfit, User } from "@/lib/types";

export function outfitPath(outfit: Pick<Outfit, "id" | "slug" | "creator">): string {
  const creator = outfit.creator as Pick<User, "username">;
  if (outfit.slug && creator?.username) {
    return `/${creator.username.toLowerCase()}/${outfit.slug}`;
  }
  return `/outfit/${outfit.id}`;
}

export function outfitPathFromParts(
  username: string | null | undefined,
  slug: string | null | undefined,
  id: string,
): string {
  if (username && slug) {
    return `/${username.toLowerCase()}/${slug}`;
  }
  return `/outfit/${id}`;
}
