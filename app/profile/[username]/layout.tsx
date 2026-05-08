import type { Metadata } from "next";
import { fetchProfileByUsername } from "@/lib/queries";

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

  return {
    title: `${user.displayName} (@${user.username})`,
    description: user.bio,
    alternates: { canonical: `/profile/${user.username}` },
    openGraph: {
      title: `${user.displayName} (@${user.username}) på Moidello`,
      description: user.bio,
      url: `/profile/${user.username}`,
      type: "profile",
      images: user.avatar
        ? [{ url: user.avatar, alt: user.displayName }]
        : undefined,
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
