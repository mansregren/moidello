import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get started",
  description: "Three steps to your Moidello feed.",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
