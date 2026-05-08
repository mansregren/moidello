"use client";

import { useEffect } from "react";
import { recordOutfitView } from "@/app/actions/tracking";

/**
 * Fires once per mount to record a view event for the given outfit.
 * Server-side action handles dedup of self-views and mock-id filtering.
 */
export function TrackView({ outfitId }: { outfitId: string }) {
  useEffect(() => {
    recordOutfitView(outfitId).catch(() => {
      // View logging failures shouldn't break the page.
    });
  }, [outfitId]);
  return null;
}
