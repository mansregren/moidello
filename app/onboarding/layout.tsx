import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kom igång",
  description: "Tre steg till ditt Moidello-flöde.",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
