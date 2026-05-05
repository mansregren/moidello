"use client";

import { useState } from "react";
import Image from "next/image";
import { Shirt, Footprints, Watch, Cloudy, ShoppingBag, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { outfits, categories, garmentTypes } from "@/lib/data";
import { useGender } from "@/lib/gender-context";
import { GarmentType } from "@/lib/types";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const garmentIcons: Record<string, typeof Shirt> = {
  Toppar: Shirt,
  Byxor: Sparkles,
  Skor: Footprints,
  Accessoarer: Watch,
  Ytterkläder: Cloudy,
  Klänningar: Sparkles,
  Väskor: ShoppingBag,
};

type Filter =
  | { kind: "all" }
  | { kind: "garment"; value: GarmentType }
  | { kind: "category"; value: string };

const ALL: Filter = { kind: "all" };

function filterKey(f: Filter): string {
  if (f.kind === "all") return "all";
  return `${f.kind}:${f.value}`;
}

export default function FeedPage() {
  const { gender } = useGender();
  const [filter, setFilter] = useState<Filter>(ALL);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  const genderOutfits = outfits.filter((o) => o.gender === gender);

  const filteredOutfits = genderOutfits.filter((o) => {
    if (filter.kind === "all") return true;
    if (filter.kind === "category") return o.category === filter.value;
    return o.tags.some((t) => t.garment === filter.value);
  });

  const sortedOutfits = [...filteredOutfits].sort((a, b) => {
    if (sortBy === "popular") return b.likes - a.likes;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const activeKey = filterKey(filter);

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

        <div className="relative">
          {/* Subtle background on mobile only */}
          <div className="absolute inset-0 md:hidden">
            <Image
              src="/images/bg/boats.jpg"
              alt=""
              fill
              className="object-cover opacity-[0.08]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
          </div>

          <Container className="relative z-10 pt-8">
            {/* Unified filter chips — one horizontal scroll row */}
            <div className="mb-6 -mx-6 md:-mx-12 px-6 md:px-12 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <ChipPill
                active={filter.kind === "all"}
                onClick={() => setFilter(ALL)}
              >
                Alla
              </ChipPill>

              {garmentTypes.map((type) => {
                const Icon = garmentIcons[type] || Sparkles;
                const key = filterKey({ kind: "garment", value: type as GarmentType });
                return (
                  <ChipPill
                    key={key}
                    active={activeKey === key}
                    icon={<Icon className="h-3.5 w-3.5" />}
                    onClick={() =>
                      setFilter({ kind: "garment", value: type as GarmentType })
                    }
                  >
                    {type}
                  </ChipPill>
                );
              })}

              {categories.map((cat) => {
                const key = filterKey({ kind: "category", value: cat });
                return (
                  <ChipPill
                    key={key}
                    active={activeKey === key}
                    onClick={() => setFilter({ kind: "category", value: cat })}
                  >
                    {cat}
                  </ChipPill>
                );
              })}
            </div>

            {/* Sort */}
            <div className="mb-8 flex justify-end gap-2">
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

            {/* Grid */}
            <motion.div
              key={`${gender}-${activeKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {sortedOutfits.length > 0 ? (
                <OutfitGrid outfits={sortedOutfits} columns={3} />
              ) : (
                <div className="py-24 text-center">
                  <p className="text-foreground-muted text-lg">
                    Inga outfits hittades med detta filter
                  </p>
                  <button
                    onClick={() => setFilter(ALL)}
                    className="mt-4 text-sm text-white underline"
                  >
                    Rensa filter
                  </button>
                </div>
              )}
            </motion.div>
          </Container>

          <div className="py-16" />
        </div>
      </main>
      <Footer />
    </>
  );
}

function ChipPill({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 active:scale-95",
        active
          ? "bg-white text-black"
          : "border border-border text-foreground-muted hover:border-white/30 hover:text-white"
      )}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
