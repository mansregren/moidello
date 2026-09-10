import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Moidello",
  description:
    "Moidello is a platform for discovering, sharing and being inspired by outfits — where every piece is tagged and buyable.",
  alternates: { canonical: "/om" },
  openGraph: {
    title: "About Moidello",
    description:
      "Moidello is a platform for discovering, sharing and being inspired by outfits — where every piece is tagged and buyable.",
    url: "/om",
    type: "website",
  },
};

export default function OmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
