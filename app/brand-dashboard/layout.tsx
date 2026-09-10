import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand-dashboard",
  description: "Aggregated engagement on outfits tagging your brand.",
  alternates: { canonical: "/brand-dashboard" },
  robots: { index: false, follow: true },
};

export default function BrandDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
