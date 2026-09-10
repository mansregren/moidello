import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { GenderFilteredGrid } from "@/components/outfit/GenderFilteredGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd } from "@/lib/json-ld";
import { slugify } from "@/lib/slug";
import { fetchOutfitsByColor, fetchAllColors } from "@/lib/queries";
import { colorQueryValue } from "@/lib/colors";
import { createPublicClient } from "@/lib/supabase/public";

// ISR: fetch a gender-agnostic, cacheable set; the dam/herr toggle + liked/
// saved are applied client-side (GenderFilteredGrid). Public client → no
// cookies, so the page renders statically.
export const dynamic = "force-static";
export const revalidate = 300;

function slugToColor(slug: string): string {
  const lower = slug.toLowerCase();
  if (!lower) return "";
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default async function FargPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const color = slugToColor(slug);
  if (!color) notFound();

  const client = createPublicClient();
  const [outfits, otherColors] = await Promise.all([
    fetchOutfitsByColor(colorQueryValue(slug), undefined, client),
    fetchAllColors(client),
  ]);
  if (outfits.length === 0) notFound();

  const colorLower = color.toLowerCase();
  const heading = `${color} outfits`;
  const intro = `Outfit inspiration with ${colorLower} pieces on Moidello. ${outfits.length} styled looks to take ideas from.`;

  const relatedColors = otherColors
    .filter((c) => c.color !== colorLower && c.count >= 2)
    .slice(0, 12);

  return (
    <>
      <Header />
      <JsonLd
        data={collectionPageJsonLd({
          path: `/farg/${slugify(color)}`,
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
              <li className="text-foreground">{color}</li>
            </ol>
          </nav>

          <Link
            href="/upptack"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            All outfits
          </Link>

          <div className="mb-12 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-foreground-subtle mb-3">
              Colour
            </p>
            <h1 className="font-heading text-[44px] md:text-[72px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
              {heading}
            </h1>
            <p className="mt-4 text-lg text-foreground-muted">{intro}</p>
          </div>

          <GenderFilteredGrid outfits={outfits} columns={3} />

          {relatedColors.length > 0 && (
            <section className="mt-20 mb-16 border-t border-border pt-10">
              <h2 className="text-xs uppercase tracking-[0.25em] text-foreground-subtle mb-5">
                Other colours
              </h2>
              <ul className="flex flex-wrap gap-2">
                {relatedColors.map((c) => (
                  <li key={c.color}>
                    <Link
                      href={`/farg/${slugify(c.color)}`}
                      className="inline-block rounded-full border border-border bg-background-secondary px-4 py-2 text-sm text-foreground-muted hover:text-foreground hover:border-foreground/30 transition-colors capitalize"
                    >
                      {c.color}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Container>
      </main>
    </>
  );
}
