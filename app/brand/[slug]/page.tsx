import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Crown, Star, Gem, ShoppingBag, ArrowLeft, BadgeCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { PremiumButton } from "@/components/shared/PremiumButton";
import {
  fetchBrandsAggregated,
  fetchBrandOutfits,
  fetchEngagementForViewer,
} from "@/lib/queries";

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

  const dbOutfits = await fetchBrandOutfits(dbMatch.name);
  const { liked, saved } = await fetchEngagementForViewer(
    dbOutfits.map((o) => o.id),
  );

  return (
    <BrandShell
      name={dbMatch.name}
      description={
        dbMatch.isClaimed
          ? "Verifierat märke på Moidello"
          : `Outfits som taggar ${dbMatch.name}.`
      }
      website={dbMatch.claimedBy?.website ?? null}
      tierLabel="Contemporary"
      TierIcon={Star}
      outfits={dbOutfits}
      likedIds={Array.from(liked)}
      savedIds={Array.from(saved)}
      outfitsCount={dbOutfits.length}
      verified={dbMatch.isClaimed}
    />
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
}) {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-20 md:pt-24">
        <Container>
          <Link
            href="/brands"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-white transition-colors mb-8"
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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white text-black px-3 py-1 text-[11px] uppercase tracking-wider font-semibold">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verifierat
                </span>
              )}
            </div>
            <h1 className="font-heading text-[48px] md:text-[80px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
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
        </Container>
      </main>
    </>
  );
}
