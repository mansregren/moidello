import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistik",
  description: "Se hur dina outfits presterar — visningar, gillningar, klick.",
  alternates: { canonical: "/profil/statistik" },
};

export default function StatistikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
