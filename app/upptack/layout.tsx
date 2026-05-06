import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upptäck",
  description:
    "Bläddra bland tusentals outfits, filtrera på stil, kategori och färg.",
  alternates: { canonical: "/upptack" },
};

export default function UpptackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
