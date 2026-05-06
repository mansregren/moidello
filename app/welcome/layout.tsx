import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Välkommen till Moidello",
  description:
    "Den sociala plattformen för outfits. Inspirera och bli inspirerad — varje plagg taggat, varje länk redo.",
  alternates: { canonical: "/welcome" },
};

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
