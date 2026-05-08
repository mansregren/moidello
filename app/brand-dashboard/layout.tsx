import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand-dashboard",
  description: "Aggregerat engagemang på outfits som taggar ditt märke.",
  alternates: { canonical: "/brand-dashboard" },
};

export default function BrandDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
