import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trending now",
  description:
    "See what's trending right now — popular outfits, brands and styles.",
  alternates: { canonical: "/trendigt" },
};

export default function TrendigtLayout({ children }: { children: React.ReactNode }) {
  return children;
}
