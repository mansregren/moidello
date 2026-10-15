import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mina samlingar",
  description: "Create and manage your outfit collections.",
  alternates: { canonical: "/profil/boards" },
};

export default function BoardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
