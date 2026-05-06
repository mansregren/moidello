import type { Metadata } from "next";
import { brands } from "@/lib/data";

export function generateStaticParams() {
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = brands.find((b) => b.slug === slug);

  if (!brand) {
    return {
      title: "Brand hittades inte",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: brand.name,
    description: brand.description,
    alternates: { canonical: `/brand/${brand.slug}` },
    openGraph: {
      title: `${brand.name} på Moidello`,
      description: brand.description,
      url: `/brand/${brand.slug}`,
      type: "website",
    },
  };
}

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return children;
}
