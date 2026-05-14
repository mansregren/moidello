"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  searchBrandProducts,
  type BrandProductHit,
} from "@/app/actions/brand-search";

interface PickedProduct {
  brand: string;
  name: string;
  buyUrl: string;
  price?: number | null;
  currency?: string | null;
}

/**
 * Brand-product autocomplete. Drops below an input — when the user types
 * a brand name or product, hits brand_products and lets them one-click
 * an entire row into the tag form. Falls back gracefully when no hits
 * exist (creators just keep typing manually).
 */
export function BrandAutocomplete({
  brand,
  onChangeBrand,
  onPick,
}: {
  brand: string;
  onChangeBrand: (v: string) => void;
  onPick: (product: PickedProduct) => void;
}) {
  const [hits, setHits] = useState<BrandProductHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search.
  useEffect(() => {
    if (brand.trim().length < 2) {
      setHits([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const results = await searchBrandProducts(brand);
        setHits(results);
        if (results.length > 0) setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [brand]);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (h: BrandProductHit) => {
    onPick({
      brand: titleCase(h.brand_key),
      name: h.name,
      buyUrl: h.buy_url ?? "",
      price: h.price,
      currency: h.currency,
    });
    setOpen(false);
    setHits([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        placeholder="Märke (t.ex. Nike)"
        value={brand}
        onChange={(e) => onChangeBrand(e.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        className="w-full rounded-lg bg-background-tertiary border border-border px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle outline-none"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle animate-spin" />
      )}

      {open && hits.length > 0 && (
        <div className="absolute z-30 mt-1 left-0 right-0 rounded-xl bg-background-secondary border border-border shadow-2xl max-h-72 overflow-y-auto">
          <p className="px-3 pt-3 pb-2 text-[10px] uppercase tracking-wider text-foreground-subtle inline-flex items-center gap-1.5">
            <Search className="h-3 w-3" />
            Föreslagna plagg från katalogen
          </p>
          <ul className="pb-2">
            {hits.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => pick(h)}
                  className="w-full text-left px-3 py-2 hover:bg-foreground/5 transition-colors"
                >
                  <p className="text-xs uppercase tracking-wider text-foreground-muted">
                    {titleCase(h.brand_key)}
                  </p>
                  <p className="text-sm text-foreground truncate">{h.name}</p>
                  {h.price !== null && h.price > 0 && (
                    <p className="text-xs text-foreground-subtle">
                      {h.price.toLocaleString("sv-SE")}{" "}
                      {h.currency ?? "SEK"}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
