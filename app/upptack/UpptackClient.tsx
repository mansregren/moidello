"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { categories } from "@/lib/data";
import { useGender, matchesGenderFilter } from "@/lib/gender-context";
import { cn } from "@/lib/utils";
import type { Outfit } from "@/lib/types";

export default function UpptackClient({
  outfits,
  likedIds = [],
  savedIds = [],
}: {
  outfits: Outfit[];
  likedIds?: string[];
  savedIds?: string[];
}) {
  const { gender } = useGender();
  const liked = useMemo(() => new Set(likedIds), [likedIds]);
  const saved = useMemo(() => new Set(savedIds), [savedIds]);
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return outfits.filter((o) => {
      if (!matchesGenderFilter(o.gender, gender)) return false;
      if (category && o.category !== category) return false;
      if (q) {
        const inText =
          o.title.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.creator.displayName.toLowerCase().includes(q) ||
          o.tags.some((t) => t.brand.toLowerCase().includes(q));
        if (!inText) return false;
      }
      return true;
    });
  }, [search, gender, category, outfits]);

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        <Container className="pt-6 md:pt-10">
          {/* Title + search */}
          <div className="mb-5">
            <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
              Discover
            </h1>
            <div className="relative mt-5 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-subtle" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search outfits, profiles, brands…"
                className="w-full rounded-full bg-background-tertiary border border-border pl-12 pr-12 py-3 text-foreground placeholder:text-foreground-subtle outline-none focus:border-foreground/30 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-foreground-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category pills — the only filter */}
          <div className="sticky top-14 md:top-20 z-20 -mx-6 md:-mx-12 px-6 md:px-12 py-3 bg-background/85 backdrop-blur-md border-b border-foreground/5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setCategory(null)}
                  aria-pressed={category === null}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
                    category === null
                      ? "bg-foreground text-background"
                      : "border border-border text-foreground-muted hover:text-foreground hover:border-foreground/30"
                  )}
                >
                  All
                </button>
                {categories.map((c) => {
                  const active = category === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategory(active ? null : c)}
                      aria-pressed={active}
                      className={cn(
                        "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
                        active
                          ? "bg-foreground text-background"
                          : "border border-border text-foreground-muted hover:text-foreground hover:border-foreground/30"
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>

              <p className="hidden md:block shrink-0 text-sm text-foreground-muted whitespace-nowrap">
                <span className="text-foreground font-semibold">{visible.length}</span>{" "}
                {visible.length === 1 ? "outfit" : "outfits"}
              </p>
            </div>
          </div>

          <div className="mt-4">
            {visible.length > 0 ? (
              <OutfitGrid outfits={visible} columns={4} liked={liked} saved={saved} />
            ) : (
              <EmptyState
                icon={Search}
                title="No outfits found"
                description="Try a different category or search term. There’s always something to discover."
                action={
                  <button
                    onClick={() => {
                      setCategory(null);
                      setSearch("");
                    }}
                    className="rounded-full bg-foreground text-background px-6 py-2.5 text-sm font-medium transition-transform active:scale-95 hover:bg-foreground/90"
                  >
                    Clear filters
                  </button>
                }
              />
            )}
            <div className="py-16" />
          </div>
        </Container>
      </main>
    </>
  );
}

