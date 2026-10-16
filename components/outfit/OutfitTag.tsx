"use client";

import type { PointerEvent } from "react";
import { ExternalLink, X } from "lucide-react";
import { TaggedItem as TaggedItemType, Region } from "@/lib/types";
import { resolveBuyUrl } from "@/lib/region";
import { cn } from "@/lib/utils";

interface OutfitTagProps {
  tag: TaggedItemType;
  outfitId?: string;
  region?: Region;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * A tag dot on the outfit photo. Rendered inside the photo container
 * (which clips), so the label never hangs off the edge:
 *  - phones get a card pinned to the top or bottom of the photo, away
 *    from the dot,
 *  - larger screens get a tooltip beside the dot, flipped to whichever
 *    side has room.
 * The dot is static — an endless ping on every dot kept phones repainting.
 */
export function OutfitTag({ tag, outfitId, region, open, onOpenChange }: OutfitTagProps) {
  const buyUrl = resolveBuyUrl(tag, region);
  // Once persisted, route through /go for server-side click logging +
  // future per-region affiliate suffixing. Pre-persist (create flow) keep
  // the direct URL so the preview still works without a DB row.
  const href = outfitId ? `/go/${tag.id}` : buyUrl;

  // Hover only for a real mouse: on touch, the synthetic enter + click
  // pair would open and immediately close the label.
  const hover = (next: boolean) => (e: PointerEvent) => {
    if (e.pointerType === "mouse") onOpenChange(next);
  };

  const flipLeft = tag.x > 55;
  const vertical =
    tag.y < 20 ? "top-0" : tag.y > 80 ? "bottom-0" : "top-1/2 -translate-y-1/2";

  const details = (
    <>
      <p className="text-xs text-foreground-muted truncate">
        {tag.brand}
        {tag.isAffiliate && (
          <span className="ml-1.5 text-[9px] uppercase tracking-wider text-foreground-subtle">
            Reklam
          </span>
        )}
      </p>
      <p className="text-sm font-medium text-foreground line-clamp-2">{tag.name}</p>
    </>
  );

  const buy = href && (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-medium hover:bg-foreground/90"
    >
      Buy
      <ExternalLink className="h-3 w-3" />
    </a>
  );

  return (
    <>
      <div
        className="absolute"
        style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
        onPointerEnter={hover(true)}
        onPointerLeave={hover(false)}
      >
        <button
          type="button"
          className="relative block h-7 w-7 -translate-x-1/2 -translate-y-1/2"
          onClick={() => onOpenChange(!open)}
          aria-label={`${tag.brand} ${tag.name}`}
          aria-expanded={open}
        >
          <span
            className={cn(
              "absolute inset-[5px] rounded-full bg-white/45 transition-transform",
              open && "scale-150",
            )}
          />
          <span className="absolute inset-[8px] rounded-full bg-white ring-1 ring-black/25" />
        </button>

        {open && (
          <div
            className={cn(
              "absolute z-10 hidden sm:block w-56 rounded-xl border border-border bg-background-secondary shadow-xl px-4 py-3",
              flipLeft ? "right-5" : "left-5",
              vertical,
            )}
          >
            {details}
            {buy && <div className="mt-2">{buy}</div>}
          </div>
        )}
      </div>

      {open && (
        <div
          className={cn(
            "absolute inset-x-3 z-10 flex items-center gap-3 rounded-xl border border-border bg-background-secondary shadow-xl pl-4 pr-2 py-2.5 sm:hidden",
            // Keep the card clear of the dot it belongs to.
            tag.y > 60 ? "top-3" : "bottom-3",
          )}
        >
          <div className="min-w-0 flex-1">{details}</div>
          {buy}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 text-foreground-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
