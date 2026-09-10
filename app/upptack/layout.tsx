import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Browse thousands of outfits, filter by style, category and colour.",
  alternates: { canonical: "/upptack" },
};

export default function UpptackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
