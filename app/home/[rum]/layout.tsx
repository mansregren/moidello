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
    return { title: "Not found", robots: { index: false, follow: false } };
  }
  return {
    title: `${room.label} – home decor | Moidello`,
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
