import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brands",
  description:
    "Explore brands from luxury houses to local designers — everyone who inspires the Moidello community.",
  alternates: { canonical: "/brands" },
};

export default function BrandsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
