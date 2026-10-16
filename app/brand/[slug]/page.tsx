import Image from "next/image";
import { canOptimizeImage } from "@/lib/image-host";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Globe, ArrowLeft, BadgeCheck, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { GenderFilteredGrid } from "@/components/outfit/GenderFilteredGrid";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { UserLink } from "@/components/shared/UserLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { brandPageJsonLd } from "@/lib/json-ld";
import { createPublicClient } from "@/lib/supabase/public";
import { fetchBrandsAggregated, fetchBrandOutfits } from "@/lib/queries";
import { PUBLIC_GENDER } from "@/lib/flags";
import { toCardOutfits } from "@/lib/card-outfit";
import { slugify } from "@/lib/slug";
import { brandIntro, garmentPlural, summariseBrand } from "@/lib/brand-summary";

interface BrandProduct {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  buy_url: string | null;
  image_url: string | null;
}

// ISR: brand pages are gender-agnostic on the server (the toggle + liked/
// saved apply client-side). cookies() returns empty under force-static so the
// internal Supabase clients run anon and the page caches.
export const dynamic = "force-static";
export const revalidate = 300;

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const aggregated = await fetchBrandsAggregated(undefined, PUBLIC_GENDER);
  const dbMatch = aggregated.find((b) => b.slug === slug);
  if (!dbMatch) {
    // Old URL of a brand-name variant ("drakes-uk-row") → the merged brand.
    const merged = aggregated.find((b) => b.aliasSlugs.includes(slug));
    if (merged) permanentRedirect(`/brand/${merged.slug}`);
    notFound();
  }

  const dbOutfits = await fetchBrandOutfits(dbMatch.variants, PUBLIC_GENDER);
  // A brand only tagged on hidden (Dam) outfits renders an empty grid for
  // the public — unless it is a claimed brand with its own profile.
  if (dbOutfits.length === 0 && !dbMatch.isClaimed) notFound();

  // Fetch the brand's official catalog (uploaded via brand-dashboard/import).
  const supabase = createPublicClient();
  const { data: productRows } = await supabase
    .from("brand_products")
    .select("id, name, description, price, currency, buy_url, image_url")
    .ilike("brand_key", dbMatch.name)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(60);

  const summary = summariseBrand(dbMatch.slug, dbOutfits);
  const audience = PUBLIC_GENDER === "herr" ? " for men" : "";
  const intro =
    dbOutfits.length > 0
      ? brandIntro(dbMatch.name, dbOutfits.length, summary, audience)
      : "Verified brand on Moidello.";

  return (
    <>
      <JsonLd
        data={brandPageJsonLd({
          slug,
          name: dbMatch.name,
          logo: null,
          website: dbMatch.claimedBy?.website ?? null,
          description: intro,
          outfits: dbOutfits,
        })}
      />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-20 md:pt-24">
        <Container>
          <Link
            href="/brands"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            All brands
          </Link>

          <div className="mb-12">
            {dbMatch.isClaimed && (
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1 text-[11px] uppercase tracking-wider font-semibold">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}
            <h1 className="font-heading text-[48px] md:text-[80px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground break-words">
              {dbMatch.name}
            </h1>
            <p className="mt-4 text-lg text-foreground-muted max-w-2xl">{intro}</p>
            {dbMatch.claimedBy?.website && (
              <a
                href={dbMatch.claimedBy.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block"
              >
                <PremiumButton variant="secondary" size="sm">
                  <Globe className="h-4 w-4" />
                  Visit website
                </PremiumButton>
              </a>
            )}
          </div>

          {dbOutfits.length > 0 && (
            <section className="mb-16">
              <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-6">
                Outfits with {dbMatch.name}
              </h2>
              <GenderFilteredGrid outfits={toCardOutfits(dbOutfits)} columns={3} />
            </section>
          )}

          {summary.pieces.length > 0 && (
            <section className="mb-16">
              <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-6">
                {dbMatch.name} pieces
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
                {summary.pieces.map((p) => (
                  <li key={p.id} className="min-w-0 border-b border-border">
                    <Link
                      href={`/produkt/${p.id}`}
                      className="flex items-baseline justify-between gap-4 py-3.5 hover:opacity-80 transition-opacity"
                    >
                      <span className="min-w-0 truncate text-foreground">{p.name}</span>
                      <span className="shrink-0 text-xs uppercase tracking-wider text-foreground-subtle">
                        {p.garment}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(summary.pairedBrands.length > 0 || summary.garments.length > 0) && (
            <section className="mb-16 grid gap-10 md:grid-cols-2">
              {summary.pairedBrands.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-4">
                    Worn with
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {summary.pairedBrands.slice(0, 12).map((b) => (
                      <Link
                        key={b.slug}
                        href={`/brand/${b.slug}`}
                        className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm text-foreground hover:border-foreground/30 transition-colors"
                      >
                        {b.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {PUBLIC_GENDER && summary.garments.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-4">
                    More outfits by piece
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {summary.garments.map((g) => (
                      <Link
                        key={g}
                        href={`/typ/${PUBLIC_GENDER}/${slugify(g)}`}
                        className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm text-foreground hover:border-foreground/30 transition-colors"
                      >
                        {garmentPlural(g).replace(/^./, (c) => c.toUpperCase())}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {(productRows?.length ?? 0) > 0 && (
            <section className="mb-20">
              <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-6">
                Official catalog ({productRows!.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {(productRows as BrandProduct[]).map((p) => (
                  <article
                    key={p.id}
                    className="rounded-2xl border border-border bg-background-secondary overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-[3/4] bg-background-tertiary">
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                          className="object-cover"
                          unoptimized={!canOptimizeImage(p.image_url)}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-foreground-subtle text-xs uppercase tracking-wider">
                          {dbMatch.name}
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <p className="text-sm text-foreground line-clamp-2">{p.name}</p>
                      {p.buy_url && (
                        <UserLink
                          href={p.buy_url}
                          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-semibold hover:bg-foreground/90"
                        >
                          Buy
                          <ExternalLink className="h-3 w-3" />
                        </UserLink>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </Container>
      </main>
    </>
  );
}
