import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create outfit",
  description: "Build and share your own outfit. Tag the pieces and link where to buy them.",
  alternates: { canonical: "/skapa" },
  robots: { index: false, follow: true },
};

export default function SkapaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
