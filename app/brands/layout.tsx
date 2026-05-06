import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brands",
  description:
    "Utforska brands från lyxhus till lokala designers — alla som inspirerar Moidello-communityn.",
  alternates: { canonical: "/brands" },
};

export default function BrandsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
