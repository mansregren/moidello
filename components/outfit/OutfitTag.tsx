"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { TaggedItem as TaggedItemType, Region } from "@/lib/types";
import { resolveBuyUrl } from "@/lib/region";

interface OutfitTagProps {
  tag: TaggedItemType;
  outfitId?: string;
  region?: Region;
}

export function OutfitTag({ tag, outfitId, region }: OutfitTagProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const buyUrl = resolveBuyUrl(tag, region);
  // Once persisted, route through /go for server-side click logging +
  // future per-region affiliate suffixing. Pre-persist (create flow) keep
  // the direct URL so the preview still works without a DB row.
  const href = outfitId ? `/go/${tag.id}` : buyUrl;

  return (
    <div
      className="absolute"
      style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
    >
      <button
        className="relative h-5 w-5 -translate-x-1/2 -translate-y-1/2"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        aria-label={`${tag.brand} ${tag.name}`}
        aria-expanded={showTooltip}
      >
        <span className="absolute inset-0 rounded-full bg-white/40 animate-ping" />
        <span className="absolute inset-[3px] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
      </button>

      {showTooltip && (
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 z-10 glass-strong rounded-xl px-4 py-3 min-w-[200px]"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <p className="text-xs text-foreground-muted">
            {tag.brand}
            {tag.isAffiliate && (
              <span className="ml-1.5 text-[9px] uppercase tracking-wider text-foreground-subtle">
                Reklam
              </span>
            )}
          </p>
          <p className="text-sm font-medium text-white">{tag.name}</p>
          {tag.price > 0 && (
            <p className="text-sm font-semibold text-white mt-1">
              {tag.price.toLocaleString("sv-SE")} {tag.currency}
            </p>
          )}
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white text-black px-3 py-1.5 text-xs font-medium hover:bg-white/90"
            >
              Köp
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
