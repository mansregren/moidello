"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, Crown, Star, Gem, ShoppingBag } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { brands, outfits } from "@/lib/data";
import { motion } from "framer-motion";
import { useState } from "react";

const tierLabels = {
  luxury: { label: "Lyx", icon: Crown },
  premium: { label: "Premium", icon: Gem },
  contemporary: { label: "Contemporary", icon: Star },
  "high-street": { label: "High Street", icon: ShoppingBag },
};

const tierOrder = ["luxury", "premium", "contemporary", "high-street"] as const;

export default function BrandsPage() {
  const [search, setSearch] = useState("");
  const [activeTier, setActiveTier] = useState<string | null>(null);

  const filtered = brands.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const matchesTier = !activeTier || b.tier === activeTier;
    return matchesSearch && matchesTier;
  });

  // Count outfits per brand
  const brandOutfitCount = (brandName: string) =>
    outfits.filter((o) => o.tags.some((t) => t.brand === brandName)).length;

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <div className="relative h-[28vh] md:h-[35vh] overflow-hidden">
          <Image src="/images/bg/boats.jpg" alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background" />
          <Container className="relative z-10 h-full flex items-end pb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
                Märken
              </h1>
              <p className="mt-2 text-white/60">
                Utforska alla märken på Moidello
              </p>
            </motion.div>
          </Container>
        </div>

        <Container className="pt-8 pb-16">
          {/* Search */}
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
            <input
              type="text"
              placeholder="Sök märken..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full bg-background-tertiary border border-border pl-11 pr-6 py-3 text-sm text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Tier filter */}
          <div className="flex gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveTier(null)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 active:scale-95 ${
                !activeTier
                  ? "bg-white text-black"
                  : "border border-border text-foreground-muted hover:border-white/30 hover:text-white"
              }`}
            >
              Alla
            </button>
            {tierOrder.map((tier) => {
              const { label, icon: Icon } = tierLabels[tier];
              return (
                <button
                  key={tier}
                  onClick={() => setActiveTier(activeTier === tier ? null : tier)}
                  className={`shrink-0 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 active:scale-95 ${
                    activeTier === tier
                      ? "bg-white text-black"
                      : "border border-border text-foreground-muted hover:border-white/30 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Brand grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((brand, i) => {
              const count = brandOutfitCount(brand.name);
              const { icon: TierIcon } = tierLabels[brand.tier];
              return (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                >
                  <Link href={`/brand/${brand.slug}`}>
                    <div className="group rounded-2xl border border-border bg-background-secondary p-6 hover:border-white/20 transition-all duration-300 hover:bg-background-tertiary">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-heading text-xl uppercase tracking-tight text-white group-hover:text-white/90">
                          {brand.name}
                        </h3>
                        <TierIcon className="h-4 w-4 text-foreground-subtle shrink-0 mt-1" />
                      </div>
                      <p className="text-sm text-foreground-muted line-clamp-2 mb-4">
                        {brand.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground-subtle">
                          {count} {count === 1 ? "outfit" : "outfits"}
                        </span>
                        <span className="text-xs text-foreground-subtle capitalize">
                          {tierLabels[brand.tier].label}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-foreground-muted">Inga märken hittades</p>
            </div>
          )}
        </Container>
      </main>
    </>
  );
}
