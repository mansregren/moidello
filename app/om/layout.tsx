import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Om Moidello",
  description:
    "Moidello är en plattform för att upptäcka, dela och inspireras av outfits — där varje plagg är taggat och köpbart.",
  alternates: { canonical: "/om" },
  openGraph: {
    title: "Om Moidello",
    description:
      "Moidello är en plattform för att upptäcka, dela och inspireras av outfits — där varje plagg är taggat och köpbart.",
    url: "/om",
    type: "website",
  },
};

export default function OmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
