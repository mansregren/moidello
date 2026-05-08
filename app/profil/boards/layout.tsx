import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mina samlingar",
  description: "Skapa och hantera dina samlingar med outfits.",
  alternates: { canonical: "/profil/boards" },
};

export default function BoardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
