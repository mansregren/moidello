"use client";

import { useState, useTransition } from "react";
import { Bookmark, ExternalLink, Send } from "lucide-react";
import { TaggedItem as TaggedItemType, Region } from "@/lib/types";
import { resolveBuyUrl } from "@/lib/region";
import { PremiumButton } from "../shared/PremiumButton";
import { recordTagClick } from "@/app/actions/tracking";
import { toggleSavedItem } from "@/app/actions/saved-items";
import { ShareToDmSheet } from "@/components/shared/ShareToDmSheet";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface TaggedItemProps {
  item: TaggedItemType;
  outfitId?: string;
  region?: Region;
  initiallySaved?: boolean;
}

export function TaggedItemCard({
  item,
  outfitId,
  region,
  initiallySaved = false,
}: TaggedItemProps) {
  const { isLoggedIn, requireAuth } = useAuth();
  const buyUrl = resolveBuyUrl(item, region);
  const [saved, setSaved] = useState(initiallySaved);
  const [shareOpen, setShareOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleBuyClick = () => {
    if (!outfitId) return;
    recordTagClick(item.id, outfitId).catch(() => {});
  };

  const handleToggleSave = () => {
    if (!isLoggedIn) {
      requireAuth("save");
      return;
    }
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const res = await toggleSavedItem(item.id);
      if (!res.ok) setSaved(!next);
    });
  };

  const handleShare = () => {
    if (!isLoggedIn) {
      requireAuth("save");
      return;
    }
    setShareOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 py-4 border-b border-border last:border-0">
        <div className="min-w-0">
          <p className="text-xs text-foreground-muted uppercase tracking-wider">
            {item.brand}
            {item.isAffiliate && (
              <span className="ml-2 inline-flex rounded-full bg-white/10 text-foreground-muted px-1.5 py-0.5 text-[9px] font-semibold tracking-wider">
                REKLAM
              </span>
            )}
          </p>
          <p className="text-sm font-medium text-white mt-0.5 truncate">
            {item.name}
          </p>
          {item.price > 0 && (
            <p className="text-sm text-foreground-muted mt-0.5">
              {item.price.toLocaleString("sv-SE")} {item.currency}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleSave}
            aria-label={saved ? "Ta bort sparad" : "Spara plagg"}
            aria-pressed={saved}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
              saved
                ? "bg-white text-black border-white"
                : "border-border text-foreground-muted hover:text-white hover:border-white/30",
            )}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Dela plagg"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground-muted hover:text-white hover:border-white/30 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
          {buyUrl && (
            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleBuyClick}
            >
              <PremiumButton variant="primary" size="sm">
                Köp
                <ExternalLink className="h-3 w-3" />
              </PremiumButton>
            </a>
          )}
        </div>
      </div>

      <ShareToDmSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        type="item_share"
        refId={item.id}
        title={`${item.brand} — ${item.name}`}
      />
    </>
  );
}
