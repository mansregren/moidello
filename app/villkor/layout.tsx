import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Användarvillkor",
  description: "Villkor för användning av Moidello.",
  alternates: { canonical: "/villkor" },
};

export default function VillkorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
