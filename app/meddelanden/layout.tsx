import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meddelanden",
  description: "Direktmeddelanden mellan användare på Moidello.",
  alternates: { canonical: "/meddelanden" },
};

export default function MeddelandenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
