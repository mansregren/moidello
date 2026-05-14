import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Crown, Star, Gem, ShoppingBag, ArrowLeft, BadgeCheck, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { UserLink } from "@/components/shared/UserLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { brandPageJsonLd } from "@/lib/json-ld";
import { createPublicClient } from "@/lib/supabase/public";
import { getViewerGender } from "@/lib/gender-server";
import {
  fetchBrandsAggregated,
  fetchBrandOutfits,
  fetchEngagementForViewer,
} from "@/lib/queries";

interface BrandProduct {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  buy_url: string | null;
  image_url: string | null;
}

export const dynamic = "force-dynamic";

type Tier = "luxury" | "premium" | "contemporary" | "high-street";

const tierLabels: Record<Tier, { label: string; icon: typeof Crown }> = {
  luxury: { label: "Lyx", icon: Crown },
  premium: { label: "Premium", icon: Gem },
  contemporary: { label: "Contemporary", icon: Star },
  "high-street": { label: "High Street", icon: ShoppingBag },
};

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const aggregated = await fetchBrandsAggregated();
  const dbMatch = aggregated.find((b) => b.slug === slug);
  if (!dbMatch) notFound();

  const gender = await getViewerGender();
  const dbOutfits = await fetchBrandOutfits(dbMatch.name, gender);
  const { liked, saved } = await fetchEngagementForViewer(
    dbOutfits.map((o) => o.id),
  );

  // Fetch the brand's official catalog (uploaded via brand-dashboard/import).
  const supabase = createPublicClient();
  const { data: productRows } = await supabase
    .from("brand_products")
    .select("id, name, description, price, currency, buy_url, image_url")
    .ilike("brand_key", dbMatch.name)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(60);

  const description = dbMatch.isClaimed
    ? "Verifierat märke på Moidello"
    : `Outfits som taggar ${dbMatch.name}.`;

  return (
    <>
      <JsonLd
        data={brandPageJsonLd({
          slug,
          name: dbMatch.name,
          logo: null,
          website: dbMatch.claimedBy?.website ?? null,
          description,
          outfits: dbOutfits,
        })}
      />
      <BrandShell
        name={dbMatch.name}
        description={description}
        website={dbMatch.claimedBy?.website ?? null}
        tierLabel="Contemporary"
        TierIcon={Star}
        outfits={dbOutfits}
        likedIds={Array.from(liked)}
        savedIds={Array.from(saved)}
        outfitsCount={dbOutfits.length}
        verified={dbMatch.isClaimed}
        products={(productRows as BrandProduct[] | null) ?? []}
      />
    </>
  );
}

function BrandShell({
  name,
  description,
  website,
  tierLabel,
  TierIcon,
  outfits,
  likedIds = [],
  savedIds = [],
  outfitsCount,
  verified,
  products = [],
}: {
  name: string;
  description: string;
  website: string | null;
  tierLabel: string;
  TierIcon: typeof Crown;
  outfits: import("@/lib/types").Outfit[];
  likedIds?: string[];
  savedIds?: string[];
  outfitsCount: number;
  verified: boolean;
  products?: BrandProduct[];
}) {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-20 md:pt-24">
        <Container>
          <Link
            href="/brands"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Alla märken
          </Link>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-background-secondary px-3 py-1">
                <TierIcon className="h-3.5 w-3.5 text-foreground-muted" />
                <span className="text-xs text-foreground-muted">{tierLabel}</span>
              </div>
              {verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1 text-[11px] uppercase tracking-wider font-semibold">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verifierat
                </span>
              )}
            </div>
            <h1 className="font-heading text-[48px] md:text-[80px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
              {name}
            </h1>
            <p className="mt-4 text-lg text-foreground-muted max-w-xl">
              {description}
            </p>
            <div className="mt-6 flex items-center gap-4 flex-wrap">
              {website && (
                <a href={website} target="_blank" rel="noopener noreferrer">
                  <PremiumButton variant="secondary" size="sm">
                    <Globe className="h-4 w-4" />
                    Besök hemsida
                  </PremiumButton>
                </a>
              )}
              <span className="text-sm text-foreground-subtle">
                {outfitsCount} {outfitsCount === 1 ? "outfit" : "outfits"}
              </span>
            </div>
          </div>

          {outfits.length > 0 ? (
            <section className="mb-16">
              <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-6">
                Outfits med {name}
              </h2>
              <OutfitGrid
                outfits={outfits}
                columns={3}
                liked={new Set(likedIds)}
                saved={new Set(savedIds)}
              />
            </section>
          ) : (
            <div className="py-24 text-center mb-16">
              <p className="text-foreground-muted text-lg">
                Inga outfits med {name} ännu
              </p>
              <p className="text-sm text-foreground-subtle mt-2">
                Bli först med att tagga ett plagg från {name}!
              </p>
            </div>
          )}

          {products.length > 0 && (
            <section className="mb-20">
              <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-6">
                Officiell katalog ({products.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {products.map((p) => (
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
                          unoptimized={p.image_url.startsWith("http")}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-foreground-subtle text-xs uppercase tracking-wider">
                          {name}
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <p className="text-sm text-foreground line-clamp-2">
                        {p.name}
                      </p>
                      {p.price !== null && p.price > 0 && (
                        <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
                          {p.price.toLocaleString("sv-SE")}{" "}
                          {p.currency ?? "SEK"}
                        </p>
                      )}
                      {p.buy_url && (
                        <UserLink
                          href={p.buy_url}
                          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-semibold hover:bg-foreground/90"
                        >
                          Köp
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
