import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd } from "@/lib/json-ld";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Stilguider",
  description:
    "Stilguider från Moidello — skandinavisk minimalism, capsule wardrobe, smart casual för jobb, höstgarderob, baggy jeans och fler outfit-tips.",
  alternates: { canonical: "/guider" },
};

export default function GuiderIndex() {
  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          path: "/guider",
          name: "Stilguider — Moidello",
          description:
            "Praktiska guider till stilar, plagg och säsongs-outfits skrivna för svenskt klimat och svenska shopping-vanor.",
          outfits: [],
        })}
      />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        <Container className="py-16 md:py-24 max-w-3xl">
          <div className="border-b border-border pb-10 mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-4">
              Guider
            </p>
            <h1 className="font-heading text-5xl md:text-7xl uppercase tracking-tight leading-none">
              Stilguider
            </h1>
            <p className="mt-6 text-lg text-foreground-muted max-w-2xl">
              Praktiska guider till stilar, plagg och säsongs-outfits.
              Skrivna för svenskt klimat och svenska shopping-vanor.
            </p>
          </div>

          <ul className="space-y-8">
            {GUIDES.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guider/${g.slug}`}
                  className="block group"
                >
                  <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-foreground group-hover:text-foreground-muted transition-colors mb-2">
                    {g.title}
                  </h2>
                  <p className="text-foreground-muted leading-relaxed">
                    {g.intro}
                  </p>
                  <span className="mt-3 inline-block text-xs uppercase tracking-wider text-foreground-subtle group-hover:text-foreground transition-colors">
                    Läs guiden →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </main>
    </>
  );
}
