"use client";

import { useState } from "react";
import { TaggedItem as TaggedItemType } from "@/lib/types";

interface OutfitTagProps {
  tag: TaggedItemType;
}

export function OutfitTag({ tag }: OutfitTagProps) {
  const [showTooltip, setShowTooltip] = useState(false);

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
      >
        {/* Pulsing dot */}
        <span className="absolute inset-0 rounded-full bg-white/40 animate-ping" />
        <span className="absolute inset-[3px] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 glass-strong rounded-xl px-4 py-3 min-w-[180px]">
          <p className="text-xs text-foreground-muted">{tag.brand}</p>
          <p className="text-sm font-medium text-white">{tag.name}</p>
          <p className="text-sm font-semibold text-white mt-1">
            {tag.price.toLocaleString("sv-SE")} {tag.currency}
          </p>
        </div>
      )}
    </div>
  );
}
