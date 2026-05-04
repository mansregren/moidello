"use client";

import { useState } from "react";
import Image from "next/image";
import { Shirt, Footprints, Watch, Cloudy, ShoppingBag, Sparkles, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { outfits, categories, garmentTypes } from "@/lib/data";
import { useGender } from "@/lib/gender-context";
import { GarmentType } from "@/lib/types";
import { motion } from "framer-motion";

const garmentIcons: Record<string, typeof Shirt> = {
  Toppar: Shirt,
  Byxor: Sparkles,
  Skor: Footprints,
  Accessoarer: Watch,
  Ytterkläder: Cloudy,
  Klänningar: Sparkles,
  Väskor: ShoppingBag,
};

export default function FeedPage() {
  const { gender } = useGender();
  const [activeCategory, setActiveCategory] = useState<string>("Alla");
  const [activeGarment, setActiveGarment] = useState<GarmentType | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  const allCategories = ["Alla", ...categories];

  const genderOutfits = outfits.filter((o) => o.gender === gender);

  let filteredOutfits =
    activeCategory === "Alla"
      ? genderOutfits
      : genderOutfits.filter((o) => o.category === activeCategory);

  if (activeGarment) {
    filteredOutfits = filteredOutfits.filter((o) =>
      o.tags.some((t) => t.garment === activeGarment)
    );
  }

  const sortedOutfits = [...filteredOutfits].sort((a, b) => {
    if (sortBy === "popular") return b.likes - a.likes;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero banner */}
        <div className="relative h-[28vh] md:h-[35vh] overflow-hidden">
          <Image
            src="/images/bg/positano.jpg"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background" />
          <Container className="relative z-10 h-full flex items-end pb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
                Feed
              </h1>
              <p className="mt-2 text-white/60">
                Senaste outfits från alla kreatörer
              </p>
            </motion.div>
          </Container>
        </div>

        <Container className="pt-8">
          {/* Garment type filter */}
          <div className="mb-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {garmentTypes.map((type) => {
              const Icon = garmentIcons[type] || Sparkles;
              const isActive = activeGarment === type;
              return (
                <button
                  key={type}
                  onClick={() =>
                    setActiveGarment(isActive ? null : type as GarmentType)
                  }
                  className={`shrink-0 flex flex-col items-center gap-1.5 rounded-2xl px-5 py-3 transition-all duration-300 active:scale-95 ${
                    isActive
                      ? "bg-white text-black"
                      : "border border-border text-foreground-muted hover:border-white/30 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{type}</span>
                </button>
              );
            })}
          </div>

          {/* Active garment indicator */}
          {activeGarment && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-foreground-muted">
                Visar outfits med: <span className="text-white font-medium">{activeGarment}</span>
              </span>
              <button
                onClick={() => setActiveGarment(null)}
                className="flex items-center gap-1 text-xs text-foreground-subtle hover:text-white transition-colors"
              >
                <X className="h-3 w-3" />
                Rensa
              </button>
            </div>
          )}

          {/* Style category filter + sort */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 active:scale-95 ${
                    activeCategory === cat
                      ? "bg-white text-black"
                      : "border border-border text-foreground-muted hover:border-white/30 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setSortBy("recent")}
                className={`text-sm transition-colors ${
                  sortBy === "recent" ? "text-white" : "text-foreground-subtle"
                }`}
              >
                Senaste
              </button>
              <span className="text-foreground-subtle">|</span>
              <button
                onClick={() => setSortBy("popular")}
                className={`text-sm transition-colors ${
                  sortBy === "popular" ? "text-white" : "text-foreground-subtle"
                }`}
              >
                Populära
              </button>
            </div>
          </div>

          {/* Grid */}
          <motion.div
            key={`${gender}-${activeCategory}-${activeGarment}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {sortedOutfits.length > 0 ? (
              <OutfitGrid outfits={sortedOutfits} columns={3} />
            ) : (
              <div className="py-24 text-center">
                <p className="text-foreground-muted text-lg">
                  Inga outfits hittades med dessa filter
                </p>
                <button
                  onClick={() => {
                    setActiveCategory("Alla");
                    setActiveGarment(null);
                  }}
                  className="mt-4 text-sm text-white underline"
                >
                  Rensa alla filter
                </button>
              </div>
            )}
          </motion.div>
        </Container>

        <div className="py-16" />
      </main>
      <Footer />
    </>
  );
}
