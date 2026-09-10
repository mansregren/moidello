import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using Moidello.",
  alternates: { canonical: "/villkor" },
};

export default function VillkorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
