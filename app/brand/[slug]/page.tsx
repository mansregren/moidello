"use client";

import { use } from "react";
import Link from "next/link";
import { Globe, Crown, Star, Gem, ShoppingBag, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { brands, outfits } from "@/lib/data";
import { motion } from "framer-motion";

const tierLabels = {
  luxury: { label: "Lyx", icon: Crown },
  premium: { label: "Premium", icon: Gem },
  contemporary: { label: "Contemporary", icon: Star },
  "high-street": { label: "High Street", icon: ShoppingBag },
};

export default function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const brand = brands.find((b) => b.slug === slug) ?? brands[0];
  const { icon: TierIcon, label: tierLabel } = tierLabels[brand.tier];

  // Find all outfits containing this brand
  const brandOutfits = outfits.filter((o) =>
    o.tags.some((t) => t.brand === brand.name)
  );

  // Get all unique items from this brand across outfits
  const brandItems = outfits
    .flatMap((o) => o.tags)
    .filter((t) => t.brand === brand.name)
    .filter((t, i, arr) => arr.findIndex((x) => x.name === t.name) === i);

  return (
    <>
      <Header />
      <main className="flex-1 pt-20 md:pt-24">
        <Container>
          {/* Back */}
          <Link
            href="/brands"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Alla märken
          </Link>

          {/* Brand header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-background-secondary px-3 py-1">
                <TierIcon className="h-3.5 w-3.5 text-foreground-muted" />
                <span className="text-xs text-foreground-muted">{tierLabel}</span>
              </div>
            </div>
            <h1 className="font-heading text-[48px] md:text-[80px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
              {brand.name}
            </h1>
            <p className="mt-4 text-lg text-foreground-muted max-w-xl">
              {brand.description}
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a href={brand.website} target="_blank" rel="noopener noreferrer">
                <PremiumButton variant="secondary" size="sm">
                  <Globe className="h-4 w-4" />
                  Besök hemsida
                </PremiumButton>
              </a>
              <span className="text-sm text-foreground-subtle">
                {brandOutfits.length} outfits · {brandItems.length} plagg
              </span>
            </div>
          </motion.div>

          {/* Brand items */}
          {brandItems.length > 0 && (
            <section className="mb-12">
              <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-4">
                Plagg från {brand.name}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {brandItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-background-secondary p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-foreground-subtle capitalize">{item.garment}</p>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {item.price.toLocaleString("sv-SE")} {item.currency}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Outfits featuring this brand */}
          {brandOutfits.length > 0 && (
            <section className="mb-16">
              <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-6">
                Outfits med {brand.name}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {brandOutfits.map((outfit, i) => (
                  <motion.div
                    key={outfit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                  >
                    <OutfitCard outfit={outfit} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {brandOutfits.length === 0 && (
            <div className="py-24 text-center mb-16">
              <p className="text-foreground-muted text-lg">
                Inga outfits med {brand.name} ännu
              </p>
              <p className="text-sm text-foreground-subtle mt-2">
                Bli först med att tagga ett plagg från {brand.name}!
              </p>
            </div>
          )}
        </Container>
      </main>
    </>
  );
}
