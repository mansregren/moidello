import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Min profil",
  description: "Hantera dina outfits, sparade looks och följda kreatörer.",
  alternates: { canonical: "/profil" },
};

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  return children;
}
