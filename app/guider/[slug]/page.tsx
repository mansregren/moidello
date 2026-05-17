import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { howToJsonLd } from "@/lib/json-ld";
import { findGuide, GUIDES } from "@/lib/guides";

export const dynamic = "force-static";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) {
    return { title: "Guide", robots: { index: false, follow: true } };
  }
  return {
    title: guide.title,
    description: guide.metaDescription,
    alternates: { canonical: `/guider/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.metaDescription,
      url: `/guider/${guide.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.metaDescription,
    },
  };
}

export default async function GuideDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();

  return (
    <>
      <JsonLd
        data={howToJsonLd({
          path: `/guider/${guide.slug}`,
          name: guide.title,
          description: guide.metaDescription,
          steps: guide.steps,
          totalTime: guide.totalTime,
        })}
      />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        <Container className="py-12 md:py-16 max-w-3xl">
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
                <Link href="/guider" className="hover:text-foreground">
                  Guider
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground">{guide.title}</li>
            </ol>
          </nav>

          <Link
            href="/guider"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Alla guider
          </Link>

          <article>
            <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-4">
              Guide
            </p>
            <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight leading-[0.95] text-foreground">
              {guide.title}
            </h1>
            <p className="mt-6 text-lg text-foreground-muted leading-relaxed">
              {guide.intro}
            </p>

            <ol className="mt-12 space-y-10 list-none counter-reset-[step]">
              {guide.steps.map((s, i) => (
                <li key={s.name} className="border-t border-border pt-8">
                  <p className="text-xs uppercase tracking-[0.25em] text-foreground-subtle mb-2">
                    Steg {i + 1}
                  </p>
                  <h2 className="font-heading text-xl md:text-2xl uppercase tracking-tight text-foreground mb-3">
                    {s.name}
                  </h2>
                  <p className="text-foreground-muted leading-relaxed">
                    {s.text}
                  </p>
                </li>
              ))}
            </ol>

            {guide.related && (
              <section className="mt-16 pt-10 border-t border-border">
                <h2 className="text-xs uppercase tracking-[0.25em] text-foreground-subtle mb-5">
                  Utforska vidare
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {guide.related.styles?.map((s) => (
                    <li key={`s-${s}`}>
                      <Link
                        href={`/stil/${s}`}
                        className="inline-block rounded-full border border-border bg-background-secondary px-4 py-2 text-sm text-foreground-muted hover:text-foreground hover:border-foreground/30 transition-colors capitalize"
                      >
                        Stil: {s}
                      </Link>
                    </li>
                  ))}
                  {guide.related.colors?.map((c) => (
                    <li key={`c-${c}`}>
                      <Link
                        href={`/farg/${c}`}
                        className="inline-block rounded-full border border-border bg-background-secondary px-4 py-2 text-sm text-foreground-muted hover:text-foreground hover:border-foreground/30 transition-colors capitalize"
                      >
                        Färg: {c}
                      </Link>
                    </li>
                  ))}
                  {guide.related.garments?.map((g) => (
                    <li key={`g-${g.gender}-${g.garment}`}>
                      <Link
                        href={`/typ/${g.gender}/${g.garment.toLowerCase()}`}
                        className="inline-block rounded-full border border-border bg-background-secondary px-4 py-2 text-sm text-foreground-muted hover:text-foreground hover:border-foreground/30 transition-colors capitalize"
                      >
                        {g.garment.toLowerCase()} {g.gender}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>
        </Container>
      </main>
    </>
  );
}
