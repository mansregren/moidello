import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd } from "@/lib/json-ld";
import { garmentsForGender, garmentQueryValue, canonicalGarment } from "@/lib/garments";
import { fetchOutfitsByGarment } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { DAM_PUBLIC } from "@/lib/flags";

// ISR: content is fully determined by the URL (gender + garment); liked/saved
// hydrate client-side. Cache + background-refresh, public client → no cookies.
export const dynamic = "force-static";
export const revalidate = 300;

function resolveGender(slug: string): "dam" | "herr" | null {
  const lower = slug.toLowerCase();
  if (lower === "dam" || lower === "herr") return lower;
  return null;
}

export default async function TypPage({
  params,
}: {
  params: Promise<{ gender: string; garment: string }>;
}) {
  const { gender: g, garment: gs } = await params;
  const gender = resolveGender(g);
  if (!gender) notFound();
  // Dam is admin-only while DAM_PUBLIC is off — this route is static/public
  // so it just 404s for everyone; admins browse Dam via the /upptack toggle.
  if (gender === "dam" && !DAM_PUBLIC) notFound();
  const garment = canonicalGarment(gs);
  if (!garment) notFound();

  const outfits = await fetchOutfitsByGarment(
    gender,
    garmentQueryValue(gs),
    createPublicClient(),
  );
  if (outfits.length === 0) notFound();

  const noun = garment.toLowerCase();
  const audience = gender === "herr" ? "men" : "women";
  const heading = `${noun} for ${audience}`;
  const intro = `Outfit inspiration with ${noun} on Moidello. ${outfits.length} styled looks to take ideas from.`;

  return (
    <>
      <Header />
      <JsonLd
        data={collectionPageJsonLd({
          path: `/typ/${gender}/${noun}`,
          name: heading,
          description: intro,
          outfits,
        })}
      />
      <main id="main" tabIndex={-1} className="flex-1 pt-6 md:pt-10">
        <Container>
          <nav
            aria-label="Breadcrumbs"
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
              <li className="text-foreground capitalize">
                {audience} · {noun}
              </li>
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
              {audience}
            </p>
            <h1 className="font-heading text-[44px] md:text-[72px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
              {heading}
            </h1>
            <p className="mt-4 text-lg text-foreground-muted">{intro}</p>
          </div>

          <OutfitGrid outfits={outfits} columns={3} />

          <section className="mt-20 mb-16 border-t border-border pt-10">
            <h2 className="text-xs uppercase tracking-[0.25em] text-foreground-subtle mb-5">
              Other categories for {audience}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {garmentsForGender(gender)
                .filter((g) => g.toLowerCase() !== garment.toLowerCase())
                .map((g) => (
                  <li key={g}>
                    <Link
                      href={`/typ/${gender}/${g.toLowerCase()}`}
                      className="inline-block rounded-full border border-border bg-background-secondary px-3.5 py-1.5 text-xs text-foreground-muted hover:text-foreground hover:border-foreground/30 transition-colors capitalize"
                    >
                      {g.toLowerCase()}
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
