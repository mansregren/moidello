"use client";

import { useMemo } from "react";
import { Outfit } from "@/lib/types";
import { OutfitGrid } from "./OutfitGrid";
import { useGender, matchesGenderFilter } from "@/lib/gender-context";

/**
 * Renders an outfit grid filtered to the viewer's dam/herr toggle on the
 * client. Lets the SEO landing pages (/farg, /stil, /brand) fetch a
 * gender-agnostic, cacheable set on the server while still honouring the
 * gender toggle — the personalisation that used to force those pages dynamic.
 */
export function GenderFilteredGrid({
  outfits,
  columns = 3,
}: {
  outfits: Outfit[];
  columns?: 2 | 3 | 4;
}) {
  const { gender } = useGender();
  const visible = useMemo(
    () => outfits.filter((o) => matchesGenderFilter(o.gender, gender)),
    [outfits, gender],
  );

  if (visible.length === 0) {
    return (
      <p className="text-foreground-muted">
        Inga outfits för {gender === "herr" ? "herr" : "dam"} här ännu. Byt
        kön-filtret högst upp för att se fler.
      </p>
    );
  }

  return <OutfitGrid outfits={visible} columns={columns} />;
}
