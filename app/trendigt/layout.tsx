import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trendigt nu",
  description:
    "Se vad som trendar just nu — populära outfits, brands, stilar och kreatörer.",
  alternates: { canonical: "/trendigt" },
};

export default function TrendigtLayout({ children }: { children: React.ReactNode }) {
  return children;
}
