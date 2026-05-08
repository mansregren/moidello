"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Bookmark, ExternalLink, Send } from "lucide-react";
import { TaggedItem as TaggedItemType, Region } from "@/lib/types";
import { resolveBuyUrl } from "@/lib/region";
import { recordTagClick } from "@/app/actions/tracking";
import { toggleSavedItem } from "@/app/actions/saved-items";
import { ShareToDmSheet } from "@/components/shared/ShareToDmSheet";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface TaggedItemProps {
  item: TaggedItemType;
  outfitId?: string;
  /** Parent outfit image used to render a 80x80 thumbnail focused on
   *  the tag's position in the photo. */
  outfitImage?: string;
  region?: Region;
  initiallySaved?: boolean;
}

export function TaggedItemCard({
  item,
  outfitId,
  outfitImage,
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

  // Crop the parent outfit image to the tag's pinned position for a
  // unique thumbnail per garment without uploading per-item images.
  const thumbStyle = outfitImage
    ? { objectPosition: `${item.x}% ${item.y}%` }
    : undefined;

  return (
    <>
      <article className="flex items-center gap-3 py-3 border-b border-border last:border-0">
        {/* Thumbnail (clickable → product page) */}
        <Link
          href={`/produkt/${item.id}`}
          aria-label={`${item.brand} ${item.name}`}
          className="relative h-[72px] w-[72px] sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-background-tertiary"
        >
          {outfitImage ? (
            <Image
              src={outfitImage}
              alt=""
              fill
              sizes="80px"
              style={thumbStyle}
              className="object-cover"
              unoptimized={outfitImage.startsWith("http")}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-foreground-subtle text-[10px] uppercase tracking-wider">
              {item.brand?.slice(0, 2) ?? "?"}
            </div>
          )}
        </Link>

        {/* Brand / name / price */}
        <Link
          href={`/produkt/${item.id}`}
          className="flex-1 min-w-0 hover:opacity-90 transition-opacity"
        >
          <p className="text-[10px] text-foreground-muted uppercase tracking-wider truncate">
            {item.brand}
            {item.isAffiliate && (
              <span className="ml-2 inline-flex rounded-full bg-white/10 text-foreground-muted px-1.5 py-0.5 text-[9px] font-semibold tracking-wider">
                REKLAM
              </span>
            )}
          </p>
          <p className="text-sm font-medium text-white mt-0.5 line-clamp-1">
            {item.name}
          </p>
          {item.price > 0 && (
            <p className="text-sm text-white/90 mt-0.5 tabular-nums">
              {item.price.toLocaleString("sv-SE")} {item.currency}
            </p>
          )}
        </Link>

        {/* Action buttons — compact, icon-only on mobile */}
        <div className="flex items-center gap-1.5 shrink-0">
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
            aria-label="Skicka plagg till vän"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground-muted hover:text-white hover:border-white/30 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
          {buyUrl && (
            <a
              href={buyUrl}
              target="_blank"
              rel="ugc nofollow noopener noreferrer"
              onClick={handleBuyClick}
              aria-label={`Köp ${item.brand} ${item.name}`}
              className="inline-flex items-center gap-1 rounded-full bg-white text-black px-3 py-2 text-xs font-semibold hover:bg-white/90 transition-colors"
            >
              Köp
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </article>

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
