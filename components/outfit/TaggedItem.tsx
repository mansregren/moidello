"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Bookmark, ExternalLink, Send } from "lucide-react";
import { TaggedItem as TaggedItemType, Region } from "@/lib/types";
import { resolveBuyUrl } from "@/lib/region";
import { toggleSavedItem } from "@/app/actions/saved-items";
import { ShareToDmSheet } from "@/components/shared/ShareToDmSheet";
import { UserLink } from "@/components/shared/UserLink";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

/**
 * Treats `#` and empty strings as missing — those came from seed data
 * placeholders. Used to *hide* the Köp button when no real URL exists;
 * the actual outgoing href routes through /go for click logging.
 */
function isUsableBuyUrl(url: string | undefined): url is string {
  return !!url && url !== "#" && /^https?:\/\//i.test(url);
}

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
      <article className="flex items-center gap-3 py-3 border-b border-border last:border-0">
        {/* Garment chip (clickable → product page) */}
        <Link
          href={`/produkt/${item.id}`}
          aria-label={`${item.brand} ${item.name}`}
          className="relative h-[72px] w-[72px] sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-background-tertiary border border-border flex items-center justify-center px-2 text-center"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted leading-tight">
            {item.garment}
          </span>
        </Link>

        {/* Brand / name / price */}
        <Link
          href={`/produkt/${item.id}`}
          className="flex-1 min-w-0 hover:opacity-90 transition-opacity"
        >
          <p className="text-[10px] text-foreground-muted uppercase tracking-wider truncate">
            {item.brand}
            {item.isAffiliate && (
              <span className="ml-2 inline-flex rounded-full bg-foreground/10 text-foreground-muted px-1.5 py-0.5 text-[9px] font-semibold tracking-wider">
                REKLAM
              </span>
            )}
          </p>
          <p className="text-sm font-medium text-foreground mt-0.5 line-clamp-1">
            {item.name}
          </p>
          {item.price > 0 && (
            <p className="text-sm text-foreground/90 mt-0.5 tabular-nums">
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
              "flex h-11 w-11 items-center justify-center rounded-full border transition-colors",
              saved
                ? "bg-foreground text-background border-foreground"
                : "border-border text-foreground-muted hover:text-foreground hover:border-foreground/30",
            )}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Skicka plagg till vän"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground-muted hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
          {isUsableBuyUrl(buyUrl) && (
            <UserLink
              href={outfitId ? `/go/${item.id}` : buyUrl}
              aria-label={`Köp ${item.brand} ${item.name}`}
              className="inline-flex items-center gap-1 rounded-full bg-foreground text-background px-3 py-2 text-xs font-semibold hover:bg-foreground/90 transition-colors"
            >
              Köp
              <ExternalLink className="h-3 w-3" />
            </UserLink>
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
