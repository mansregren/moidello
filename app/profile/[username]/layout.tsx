import type { Metadata } from "next";
import { fetchProfileByUsername } from "@/lib/queries";

const SITE = "Moidello";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await fetchProfileByUsername(username);

  if (!user) {
    return {
      title: "Profil hittades inte",
      robots: { index: false, follow: false },
    };
  }

  // Always canonicalize to lowercase username so /profile/EmmaStyle and
  // /profile/emmastyle don't compete in Google's eyes.
  const canonicalUsername = user.username.toLowerCase();
  const canonical = `/profile/${canonicalUsername}`;

  const handle = `@${user.username}`;
  const countLabel = user.outfitCount > 0
    ? `${user.outfitCount} outfit${user.outfitCount === 1 ? "" : "s"}`
    : "Ny kreatör";

  const title = `${user.displayName} (${handle}) — ${countLabel} | ${SITE}`;
  const ownBio = user.bio?.trim();
  const description = ownBio
    ? ownBio
    : `Stilkreatör på ${SITE} med ${user.outfitCount} ${user.outfitCount === 1 ? "outfit" : "outfits"}.`;

  // Hide trigger-default usernames + outfit-less profiles from the index.
  const isPlaceholder = user.username.startsWith("user_");
  const isThin = user.outfitCount === 0 && !ownBio;

  return {
    title,
    description,
    alternates: { canonical },
    robots: isPlaceholder || isThin
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title: `${user.displayName} (${handle}) på ${SITE}`,
      description,
      url: canonical,
      type: "profile",
      images: user.avatar
        ? [{ url: user.avatar, alt: user.displayName }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${user.displayName} (${handle})`,
      description,
      images: user.avatar ? [user.avatar] : undefined,
    },
  };
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
