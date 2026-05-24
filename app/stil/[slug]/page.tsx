import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { GenderFilteredGrid } from "@/components/outfit/GenderFilteredGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd } from "@/lib/json-ld";
import { fetchOutfitsByCategory } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";

// ISR: gender-agnostic cacheable fetch, dam/herr + liked/saved applied
// client-side. Public client → no cookies → static render.
export const dynamic = "force-static";
export const revalidate = 300;

const STYLES: Record<string, { label: string; description: string }> = {
  minimalism: {
    label: "Minimalism",
    description:
      "Lugna palletter, rena linjer, neutrala färger. Skandinavisk minimalism med fokus på passform och material.",
  },
  vintage: {
    label: "Vintage",
    description:
      "Retro-inspirerade plagg, second hand och utvalt äldre mode. Stil som åldras snyggt istället för att bytas ut.",
  },
  casual: {
    label: "Casual",
    description:
      "Avslappnade vardagsoutfits. Lättburet, bekvämt och praktiskt — utan att tappa stilen.",
  },
  streetwear: {
    label: "Streetwear",
    description:
      "Urban stil med sneakers, oversized fits och statement-plagg. Influenser från skate, hiphop och japanska gator.",
  },
  formal: {
    label: "Formal",
    description:
      "Kostym, smarta klänningar och eleganta accessoarer. Outfits för middag, jobb och tillfällen som kräver mer.",
  },
  sporty: {
    label: "Sporty",
    description:
      "Athleisure och funktionella plagg — träningskläder som funkar utanför gymmet, lätt och rörlig stil.",
  },
  preppy: {
    label: "Preppy",
    description:
      "East coast-stil med stickade plagg, chinos, loafers och poloskjortor. Klassiskt och oansträngt sofistikerat.",
  },
};

export default async function StilPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const style = STYLES[slug.toLowerCase()];
  if (!style) notFound();

  const outfits = await fetchOutfitsByCategory(
    style.label,
    undefined,
    createPublicClient(),
  );
  if (outfits.length === 0) notFound();

  return (
    <>
      <Header />
      <JsonLd
        data={collectionPageJsonLd({
          path: `/stil/${slug.toLowerCase()}`,
          name: `${style.label} — outfit-inspiration`,
          description: style.description,
          outfits,
        })}
      />
      <main id="main" tabIndex={-1} className="flex-1 pt-6 md:pt-10">
        <Container>
          <nav
            aria-label="Brödsmulor"
            className="text-xs text-foreground-subtle mb-6"
          >
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Moidello
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/upptack" className="hover:text-foreground">
                  Outfits
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground">{style.label}</li>
            </ol>
          </nav>

          <Link
            href="/upptack"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Alla outfits
          </Link>

          <div className="mb-12 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-foreground-subtle mb-3">
              Stil
            </p>
            <h1 className="font-heading text-[44px] md:text-[72px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
              {style.label}
            </h1>
            <p className="mt-4 text-lg text-foreground-muted">
              {style.description}
            </p>
            <p className="mt-3 text-sm text-foreground-subtle">
              {outfits.length} stylade outfits från svenska kreatörer.
            </p>
          </div>

          <GenderFilteredGrid outfits={outfits} columns={3} />

          <section className="mt-20 mb-16 border-t border-border pt-10">
            <h2 className="text-xs uppercase tracking-[0.25em] text-foreground-subtle mb-5">
              Fler stilar
            </h2>
            <ul className="flex flex-wrap gap-2">
              {Object.entries(STYLES)
                .filter(([s]) => s !== slug.toLowerCase())
                .map(([s, info]) => (
                  <li key={s}>
                    <Link
                      href={`/stil/${s}`}
                      className="inline-block rounded-full border border-border bg-background-secondary px-4 py-2 text-sm text-foreground-muted hover:text-foreground hover:border-foreground/30 transition-colors"
                    >
                      {info.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        </Container>
      </main>
    </>
  );
}
