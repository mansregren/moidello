"use client";

import { ExternalLink } from "lucide-react";
import { TaggedItem as TaggedItemType, Region } from "@/lib/types";
import { resolveBuyUrl } from "@/lib/region";
import { PremiumButton } from "../shared/PremiumButton";
import { recordTagClick } from "@/app/actions/tracking";

interface TaggedItemProps {
  item: TaggedItemType;
  outfitId?: string;
  region?: Region;
}

export function TaggedItemCard({ item, outfitId, region }: TaggedItemProps) {
  const buyUrl = resolveBuyUrl(item, region);

  const handleClick = () => {
    if (!outfitId) return;
    recordTagClick(item.id, outfitId).catch(() => {
      // Click logging is best-effort — never block the navigation.
    });
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div>
        <p className="text-xs text-foreground-muted uppercase tracking-wider">
          {item.brand}
          {item.isAffiliate && (
            <span className="ml-2 inline-flex rounded-full bg-white/10 text-foreground-muted px-1.5 py-0.5 text-[9px] font-semibold tracking-wider">
              REKLAM
            </span>
          )}
        </p>
        <p className="text-sm font-medium text-white mt-0.5">{item.name}</p>
        {item.price > 0 && (
          <p className="text-sm text-foreground-muted mt-0.5">
            {item.price.toLocaleString("sv-SE")} {item.currency}
          </p>
        )}
      </div>
      {buyUrl && (
        <a
          href={buyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
        >
          <PremiumButton variant="primary" size="sm">
            Köp
            <ExternalLink className="h-3 w-3" />
          </PremiumButton>
        </a>
      )}
    </div>
  );
}
