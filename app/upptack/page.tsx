"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { outfits, brands, garmentTypes, categories } from "@/lib/data";
import { useGender, matchesGenderFilter } from "@/lib/gender-context";
import { cn } from "@/lib/utils";

type FilterCategory =
  | "garment"
  | "style"
  | "brand"
  | "color"
  | "season"
  | "price";

interface FilterState {
  garment: Set<string>;
  style: Set<string>;
  brand: Set<string>;
  color: Set<string>;
  season: Set<string>;
  price: Set<string>;
}

interface ActiveChip {
  label: string;
  category: FilterCategory;
  value: string;
}

const EMPTY_FILTERS: FilterState = {
  garment: new Set(),
  style: new Set(),
  brand: new Set(),
  color: new Set(),
  season: new Set(),
  price: new Set(),
};

const COLORS = ["Svart", "Vit", "Beige", "Pastell", "Färgglatt"];
const SEASONS = ["Sommar", "Höst", "Vinter", "Vår"];
const PRICES = ["Budget", "Mid", "Premium", "Lyx"];
const STYLES = ["Streetwear", "Minimalism", "Vintage", "Lyx", "Casual", "Sport"];

const CATEGORY_LABELS: Record<FilterCategory, string> = {
  garment: "Plagg",
  style: "Stil",
  brand: "Märke",
  color: "Färg",
  season: "Säsong",
  price: "Pris",
};

export default function UpptackPage() {
  const { gender } = useGender();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const totalActive =
    filters.garment.size +
    filters.style.size +
    filters.brand.size +
    filters.color.size +
    filters.season.size +
    filters.price.size;

  const activeChips: ActiveChip[] = useMemo(() => {
    const chips: ActiveChip[] = [];
    (Object.keys(filters) as FilterCategory[]).forEach((cat) => {
      filters[cat].forEach((value) => {
        chips.push({ label: value, category: cat, value });
      });
    });
    return chips;
  }, [filters]);

  const toggleFilter = (cat: FilterCategory, value: string) => {
    setFilters((prev) => {
      const nextSet = new Set(prev[cat]);
      if (nextSet.has(value)) nextSet.delete(value);
      else nextSet.add(value);
      return { ...prev, [cat]: nextSet };
    });
  };

  const clearAll = () => setFilters(EMPTY_FILTERS);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return outfits.filter((o) => {
      if (!matchesGenderFilter(o.gender, gender)) return false;
      if (q) {
        const inText =
          o.title.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.creator.displayName.toLowerCase().includes(q) ||
          o.tags.some((t) => t.brand.toLowerCase().includes(q));
        if (!inText) return false;
      }
      if (filters.garment.size > 0) {
        const hit = o.tags.some((t) => filters.garment.has(t.garment));
        if (!hit) return false;
      }
      if (filters.style.size > 0 && !filters.style.has(o.category)) return false;
      if (filters.brand.size > 0) {
        const hit = o.tags.some((t) => filters.brand.has(t.brand));
        if (!hit) return false;
      }
      // Color/season/price are dummy filters in phase 1 — always pass-through
      return true;
    });
  }, [search, gender, filters]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <Container className="pt-6 md:pt-10">
          {/* Title + search */}
          <div className="mb-5">
            <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
              Upptäck
            </h1>
            <div className="relative mt-5 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-subtle" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Sök outfits, kreatörer, märken…"
                className="w-full rounded-full bg-background-tertiary border border-border pl-12 pr-12 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Rensa sök"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-foreground-muted hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick filters — garment chips (always visible) */}
          <div className="-mx-6 md:-mx-12 px-6 md:px-12 mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {garmentTypes.map((g) => {
              const active = filters.garment.has(g);
              return (
                <button
                  key={g}
                  onClick={() => toggleFilter("garment", g)}
                  aria-pressed={active}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
                    active
                      ? "bg-white text-black"
                      : "border border-border text-foreground-muted hover:text-white hover:border-white/30"
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>

          {/* Sticky filter bar */}
          <div className="sticky top-14 md:top-20 z-20 -mx-6 md:-mx-12 px-6 md:px-12 py-3 bg-background/85 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors active:scale-95",
                  totalActive > 0
                    ? "bg-white text-black"
                    : "border border-border text-white bg-background-secondary"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter
                {totalActive > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black text-white px-1.5 text-[11px] font-bold">
                    {totalActive}
                  </span>
                )}
              </button>

              <p className="text-xs text-foreground-muted">
                <span className="text-white font-semibold">{visible.length}</span>{" "}
                resultat
              </p>
            </div>

            {/* Desktop result count */}
            <div className="hidden lg:flex items-center justify-between">
              <p className="text-sm text-foreground-muted">
                <span className="text-white font-semibold">{visible.length}</span>{" "}
                {visible.length === 1 ? "outfit" : "outfits"}
              </p>
              {totalActive > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-foreground-muted hover:text-white"
                >
                  Rensa alla filter
                </button>
              )}
            </div>
          </div>

          {/* Active filter chips */}
          <AnimatePresence initial={false}>
            {activeChips.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-2 pt-3 pb-1">
                  {activeChips.map((chip) => (
                    <button
                      key={`${chip.category}-${chip.value}`}
                      onClick={() => toggleFilter(chip.category, chip.value)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white text-black pl-3 pr-2 py-1 text-xs font-medium transition-transform active:scale-95"
                    >
                      <span className="text-[10px] uppercase tracking-wider text-black/50">
                        {CATEGORY_LABELS[chip.category]}:
                      </span>
                      {chip.label}
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/10">
                        <X className="h-2.5 w-2.5" strokeWidth={2.5} />
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={clearAll}
                    className="text-xs text-foreground-muted hover:text-white px-2 py-1 lg:hidden"
                  >
                    Rensa alla
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-8 mt-4">
            {/* Desktop filter sidebar */}
            <aside className="hidden lg:block w-72 shrink-0">
              <FilterPanel
                filters={filters}
                onToggle={toggleFilter}
                onClear={clearAll}
                totalActive={totalActive}
              />
            </aside>

            {/* Results */}
            <div className="flex-1 min-w-0">
              {visible.length > 0 ? (
                <OutfitGrid outfits={visible} columns={3} />
              ) : (
                <div className="py-24 text-center">
                  <p className="text-foreground-muted text-lg">
                    Inga outfits hittades
                  </p>
                  <button
                    onClick={() => {
                      clearAll();
                      setSearch("");
                    }}
                    className="mt-4 text-sm text-white underline"
                  >
                    Rensa allt
                  </button>
                </div>
              )}
              <div className="py-16" />
            </div>
          </div>
        </Container>

        {/* Mobile filter drawer */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            >
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 bottom-0 right-0 w-[88vw] max-w-sm bg-background border-l border-white/5 flex flex-col"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
                  <h2 className="text-base font-semibold text-white">
                    Filter
                    {totalActive > 0 && (
                      <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white text-black px-1.5 text-[11px] font-bold align-middle">
                        {totalActive}
                      </span>
                    )}
                  </h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    aria-label="Stäng filter"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/5"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  <FilterPanel
                    filters={filters}
                    onToggle={toggleFilter}
                    onClear={clearAll}
                    totalActive={totalActive}
                  />
                </div>

                {/* Sticky bottom bar */}
                <div className="border-t border-white/5 p-4 flex gap-3 shrink-0 bg-background">
                  {totalActive > 0 && (
                    <button
                      onClick={clearAll}
                      className="rounded-full border border-border text-white px-4 py-3 text-sm font-medium hover:border-white/30"
                    >
                      Rensa
                    </button>
                  )}
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="flex-1 rounded-full bg-white text-black py-3 text-sm font-semibold transition-transform active:scale-95"
                  >
                    Visa {visible.length} resultat
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

function FilterPanel({
  filters,
  onToggle,
  onClear,
  totalActive,
}: {
  filters: FilterState;
  onToggle: (cat: FilterCategory, value: string) => void;
  onClear: () => void;
  totalActive: number;
}) {
  return (
    <div>
      {totalActive > 0 && (
        <button
          onClick={onClear}
          className="mb-4 text-xs uppercase tracking-wider text-foreground-muted hover:text-white"
        >
          Rensa filter ({totalActive})
        </button>
      )}

      <Accordion title="Plagg" badge={filters.garment.size} defaultOpen>
        <CheckList
          values={garmentTypes as readonly string[]}
          selected={filters.garment}
          onToggle={(v) => onToggle("garment", v)}
        />
      </Accordion>

      <Accordion title="Stil" badge={filters.style.size} defaultOpen>
        <CheckList
          values={Array.from(new Set([...STYLES, ...categories]))}
          selected={filters.style}
          onToggle={(v) => onToggle("style", v)}
        />
      </Accordion>

      <Accordion title="Märken" badge={filters.brand.size}>
        <BrandList
          selected={filters.brand}
          onToggle={(v) => onToggle("brand", v)}
        />
      </Accordion>

      <Accordion title="Färg" badge={filters.color.size}>
        <CheckList
          values={COLORS}
          selected={filters.color}
          onToggle={(v) => onToggle("color", v)}
        />
      </Accordion>

      <Accordion title="Säsong" badge={filters.season.size}>
        <CheckList
          values={SEASONS}
          selected={filters.season}
          onToggle={(v) => onToggle("season", v)}
        />
      </Accordion>

      <Accordion title="Pris" badge={filters.price.size}>
        <CheckList
          values={PRICES}
          selected={filters.price}
          onToggle={(v) => onToggle("price", v)}
        />
      </Accordion>
    </div>
  );
}

function Accordion({
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  badge?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border py-3">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-1 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white uppercase tracking-wide">
            {title}
          </span>
          {badge && badge > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white text-black px-1.5 text-[10px] font-semibold">
              {badge}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-foreground-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckList({
  values,
  selected,
  onToggle,
}: {
  values: readonly string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-1.5">
      {values.map((v) => {
        const checked = selected.has(v);
        return (
          <li key={v}>
            <label className="flex items-center gap-3 cursor-pointer py-1 group">
              <span
                className={cn(
                  "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                  checked
                    ? "bg-white border-white"
                    : "border-border group-hover:border-white/40"
                )}
              >
                {checked && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3 text-black">
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(v)}
                className="sr-only"
              />
              <span
                className={cn(
                  "text-sm transition-colors",
                  checked ? "text-white" : "text-foreground-muted group-hover:text-white"
                )}
              >
                {v}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function BrandList({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (v: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-subtle" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sök märke…"
          className="w-full rounded-lg bg-background-tertiary border border-border pl-9 pr-3 py-2 text-xs text-white placeholder:text-foreground-subtle outline-none focus:border-white/30"
        />
      </div>
      <div className="max-h-64 overflow-y-auto pr-1 -mr-1">
        <CheckList
          values={filtered.map((b) => b.name)}
          selected={selected}
          onToggle={onToggle}
        />
      </div>
    </div>
  );
}
