import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Min profil",
  description: "Manage your outfits and saved looks.",
  alternates: { canonical: "/profil" },
  robots: { index: false, follow: true },
};

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  return children;
}
