"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { brands, garmentTypes, categories } from "@/lib/data";
import { useGender, matchesGenderFilter } from "@/lib/gender-context";
import { cn } from "@/lib/utils";
import type { Outfit } from "@/lib/types";

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
  }, [search, gender, filters, outfits]);

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        <Container className="pt-6 md:pt-10">
          {/* Title + search */}
          <div className="mb-5">
            <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
              Upptäck
            </h1>
            <div className="relative mt-5 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-subtle" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Sök outfits, kreatörer, märken…"
                className="w-full rounded-full bg-background-tertiary border border-border pl-12 pr-12 py-3 text-foreground placeholder:text-foreground-subtle outline-none focus:border-foreground/30 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Rensa sök"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-foreground-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick filters — garment chips (mobile only; desktop has Plagg dropdown) */}
          <div className="lg:hidden -mx-6 md:-mx-12 px-6 md:px-12 mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
                      ? "bg-foreground text-background"
                      : "border border-border text-foreground-muted hover:text-foreground hover:border-foreground/30"
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>

          {/* Sticky filter bar */}
          <div className="sticky top-14 md:top-20 z-20 -mx-6 md:-mx-12 px-6 md:px-12 py-3 bg-background/85 backdrop-blur-md border-b border-foreground/5">
            {/* Mobile: single Filter button */}
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors active:scale-95",
                  totalActive > 0
                    ? "bg-foreground text-background"
                    : "border border-border text-foreground bg-background-secondary"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter
                {totalActive > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-background text-foreground px-1.5 text-[11px] font-bold">
                    {totalActive}
                  </span>
                )}
              </button>

              <p className="text-xs text-foreground-muted">
                <span className="text-foreground font-semibold">{visible.length}</span>{" "}
                resultat
              </p>
            </div>

            {/* Desktop: row of filter dropdowns + count + clear */}
            <div className="hidden lg:flex items-center gap-2 flex-wrap">
              <FilterDropdown label="Plagg" badge={filters.garment.size}>
                <CheckList
                  values={garmentTypes as readonly string[]}
                  selected={filters.garment}
                  onToggle={(v) => toggleFilter("garment", v)}
                />
              </FilterDropdown>
              <FilterDropdown label="Stil" badge={filters.style.size}>
                <CheckList
                  values={Array.from(new Set([...STYLES, ...categories]))}
                  selected={filters.style}
                  onToggle={(v) => toggleFilter("style", v)}
                />
              </FilterDropdown>
              <FilterDropdown label="Märken" badge={filters.brand.size} width="w-80">
                <BrandList
                  selected={filters.brand}
                  onToggle={(v) => toggleFilter("brand", v)}
                />
              </FilterDropdown>
              <FilterDropdown label="Färg" badge={filters.color.size}>
                <CheckList
                  values={COLORS}
                  selected={filters.color}
                  onToggle={(v) => toggleFilter("color", v)}
                />
              </FilterDropdown>
              <FilterDropdown label="Säsong" badge={filters.season.size}>
                <CheckList
                  values={SEASONS}
                  selected={filters.season}
                  onToggle={(v) => toggleFilter("season", v)}
                />
              </FilterDropdown>
              <FilterDropdown label="Pris" badge={filters.price.size}>
                <CheckList
                  values={PRICES}
                  selected={filters.price}
                  onToggle={(v) => toggleFilter("price", v)}
                />
              </FilterDropdown>

              <div className="ml-auto flex items-center gap-4">
                <p className="text-sm text-foreground-muted whitespace-nowrap">
                  <span className="text-foreground font-semibold">{visible.length}</span>{" "}
                  {visible.length === 1 ? "outfit" : "outfits"}
                </p>
                {totalActive > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-sm text-foreground-muted hover:text-foreground whitespace-nowrap"
                  >
                    Rensa alla
                  </button>
                )}
              </div>
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
                      className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background pl-3 pr-2 py-1 text-xs font-medium transition-transform active:scale-95"
                    >
                      <span className="text-[10px] uppercase tracking-wider text-background/50">
                        {CATEGORY_LABELS[chip.category]}:
                      </span>
                      {chip.label}
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-background/10">
                        <X className="h-2.5 w-2.5" strokeWidth={2.5} />
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={clearAll}
                    className="text-xs text-foreground-muted hover:text-foreground px-2 py-1 lg:hidden"
                  >
                    Rensa alla
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4">
            {visible.length > 0 ? (
              <OutfitGrid outfits={visible} columns={4} liked={liked} saved={saved} />
            ) : (
              <EmptyState
                icon={Search}
                title="Inga outfits hittades"
                description="Prova att rensa filtren eller söka på något annat. Det finns alltid något att upptäcka."
                action={
                  <button
                    onClick={() => {
                      clearAll();
                      setSearch("");
                    }}
                    className="rounded-full bg-foreground text-background px-6 py-2.5 text-sm font-medium transition-transform active:scale-95 hover:bg-foreground/90"
                  >
                    Rensa alla filter
                  </button>
                }
              />
            )}
            <div className="py-16" />
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
                className="absolute top-0 bottom-0 right-0 w-[88vw] max-w-sm bg-background border-l border-foreground/5 flex flex-col"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-foreground/5 shrink-0">
                  <h2 className="text-base font-semibold text-foreground">
                    Filter
                    {totalActive > 0 && (
                      <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground text-background px-1.5 text-[11px] font-bold align-middle">
                        {totalActive}
                      </span>
                    )}
                  </h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    aria-label="Stäng filter"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-foreground/5"
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
                <div className="border-t border-foreground/5 p-4 flex gap-3 shrink-0 bg-background">
                  {totalActive > 0 && (
                    <button
                      onClick={clearAll}
                      className="rounded-full border border-border text-foreground px-4 py-3 text-sm font-medium hover:border-foreground/30"
                    >
                      Rensa
                    </button>
                  )}
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="flex-1 rounded-full bg-foreground text-background py-3 text-sm font-semibold transition-transform active:scale-95"
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
          className="mb-4 text-xs uppercase tracking-wider text-foreground-muted hover:text-foreground"
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
          <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
            {title}
          </span>
          {badge && badge > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground text-background px-1.5 text-[10px] font-semibold">
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
                    ? "bg-foreground border-foreground"
                    : "border-border group-hover:border-foreground/40"
                )}
              >
                {checked && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3 text-background">
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
                  checked ? "text-foreground" : "text-foreground-muted group-hover:text-foreground"
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

function FilterDropdown({
  label,
  badge,
  width = "w-72",
  children,
}: {
  label: string;
  badge: number;
  width?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = badge > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-foreground text-background hover:bg-foreground/90"
            : "border border-border text-foreground bg-background-secondary hover:border-foreground/30"
        )}
      >
        {label}
        {active && (
          <span
            className={cn(
              "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
              "bg-background text-foreground"
            )}
          >
            {badge}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute top-full left-0 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl bg-background-secondary border border-border p-4 z-30 shadow-2xl shadow-black/50",
              width
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
          className="w-full rounded-lg bg-background-tertiary border border-border pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-foreground-subtle outline-none focus:border-foreground/30"
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
