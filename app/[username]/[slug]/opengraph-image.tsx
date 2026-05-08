import { fetchOutfitBySlug } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { loadAnton, loadInter } from "@/lib/og-fonts";
import {
  renderOutfitOg,
  renderOutfitOgFallback,
  buildOutfitOgAlt,
} from "@/lib/og-outfit";
import { isReservedUsername } from "@/lib/reserved-usernames";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateImageMetadata({
  params,
}: {
  params: { username?: string; slug?: string };
}) {
  const username = params?.username;
  const slug = params?.slug;
  if (!username || !slug || isReservedUsername(username)) {
    return [{ id: "default", alt: "Moidello", contentType, size }];
  }
  const outfit = await fetchOutfitBySlug(
    username,
    slug,
    createPublicClient(),
  );
  if (!outfit) {
    return [{ id: "default", alt: "Moidello", contentType, size }];
  }
  return [
    { id: "default", alt: buildOutfitOgAlt(outfit), contentType, size },
  ];
}

export default async function Image({
  params,
}: {
  params: { username?: string; slug?: string };
}) {
  const username = params?.username;
  const slug = params?.slug;
  const skip = !username || !slug || isReservedUsername(username);
  const [outfit, anton, inter] = await Promise.all([
    skip
      ? Promise.resolve(null)
      : fetchOutfitBySlug(username, slug, createPublicClient()),
    loadAnton(),
    loadInter(),
  ]);
  if (!outfit) return renderOutfitOgFallback({ anton, inter });
  return renderOutfitOg(outfit, { anton, inter });
}
