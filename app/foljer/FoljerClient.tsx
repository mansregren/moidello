"use client";

import { useMemo } from "react";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { useGender, matchesGenderFilter } from "@/lib/gender-context";
import type { Outfit } from "@/lib/types";

/**
 * Gender-filtered render of /foljer's feed. Server-component fetches all
 * outfits the viewer follows; this client wrapper trims to the gender the
 * viewer has chosen via the navbar toggle.
 */
export function FoljerClient({
  outfits,
  likedIds = [],
  savedIds = [],
}: {
  outfits: Outfit[];
  likedIds?: string[];
  savedIds?: string[];
}) {
  const { gender } = useGender();
  const filtered = useMemo(
    () => outfits.filter((o) => matchesGenderFilter(o.gender, gender)),
    [outfits, gender],
  );
  const liked = useMemo(() => new Set(likedIds), [likedIds]);
  const saved = useMemo(() => new Set(savedIds), [savedIds]);

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-background-secondary p-10 text-center">
        <p className="text-foreground-muted">
          Inga outfits för det här filtret — testa Herr/Dam-toggle i menyn.
        </p>
      </div>
    );
  }

  return <OutfitGrid outfits={filtered} columns={3} liked={liked} saved={saved} />;
}
