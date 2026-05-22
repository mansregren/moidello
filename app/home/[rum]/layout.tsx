import type { Metadata } from "next";
import { roomBySlug } from "@/lib/home-data";
import { HOME_VERTICAL_PUBLIC } from "@/lib/flags";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rum: string }>;
}): Promise<Metadata> {
  const { rum } = await params;
  const room = roomBySlug(rum);
  if (!room) {
    return { title: "Hittades inte", robots: { index: false, follow: false } };
  }
  return {
    title: `${room.label} – heminredning | Moidello`,
    description: room.description,
    alternates: { canonical: `/home/${room.slug}` },
    // Indexable only once the vertical is launched.
    robots: HOME_VERTICAL_PUBLIC
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export default function HomeRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
