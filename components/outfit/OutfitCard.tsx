"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Bookmark, LayoutGrid, Tag } from "lucide-react";
import { Outfit } from "@/lib/types";
import { UserAvatar } from "../user/UserAvatar";
import { useEffect, useState, useTransition, MouseEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { outfitPath } from "@/lib/outfit-url";
import { toggleLike, toggleSave } from "@/app/actions/engagement";

interface OutfitCardProps {
  outfit: Outfit;
  initiallyLiked?: boolean;
  initiallySaved?: boolean;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Build a SEO-rich alt for the outfit thumbnail. Title alone is too
 * thin — we mix in gender, category, and the first two distinct garment
 * types so Google Images can match the thumb against more queries.
 */
function buildOutfitAlt(outfit: Outfit): string {
  const parts: string[] = [outfit.title];
  const gender = outfit.gender === "herr" ? "herr" : "dam";
  const cat = outfit.category?.trim();
  if (cat) parts.push(cat.toLowerCase());
  parts.push(`outfit ${gender}`);

  const garments = Array.from(
    new Set(
      outfit.tags
        .map((t) => t.garment?.toLowerCase().trim())
        .filter((g): g is string => !!g),
    ),
  ).slice(0, 2);
  if (garments.length > 0) parts.push(`med ${garments.join(" och ")}`);

  if (outfit.creator?.displayName) {
    parts.push(`av ${outfit.creator.displayName}`);
  }

  return parts.join(" — ");
}

export function OutfitCard({
  outfit,
  initiallyLiked = false,
  initiallySaved = false,
}: OutfitCardProps) {
  const { isLoggedIn, requireAuth } = useAuth();
  const [hovering, setHovering] = useState(false);
  const [, startTransition] = useTransition();

  const isPersisted = UUID_RE.test(outfit.id);

  // Persistent state (not useOptimistic — that reverts the count back to the
  // SSR value as soon as the transition completes, which made the heart
  // flicker 0 → 1 → 0 after every click). We mirror the props on initial
  // mount + when the outfit id changes; user toggles persist locally.
  const [liked, setLiked] = useState(initiallyLiked);
  const [likeCount, setLikeCount] = useState(outfit.likes);
  const [saved, setSaved] = useState(initiallySaved);
  const [saveCount, setSaveCount] = useState(outfit.saves);

  useEffect(() => {
    setLiked(initiallyLiked);
    setSaved(initiallySaved);
    setLikeCount(outfit.likes);
    setSaveCount(outfit.saves);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfit.id]);

  const handleLike = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      requireAuth("like");
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    if (!isPersisted) return;
    startTransition(async () => {
      const res = await toggleLike(outfit.id);
      if (!res.ok) {
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
      }
    });
  };

  const handleSave = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      requireAuth("save");
      return;
    }
    const next = !saved;
    setSaved(next);
    setSaveCount((c) => c + (next ? 1 : -1));
    if (!isPersisted) return;
    startTransition(async () => {
      const res = await toggleSave(outfit.id);
      if (!res.ok) {
        setSaved(!next);
        setSaveCount((c) => c + (next ? -1 : 1));
      }
    });
  };

  return (
    <div className="group">
      <Link
        href={outfitPath(outfit)}
        aria-label={`${outfit.title} av ${outfit.creator.displayName}, ${outfit.tags.length} taggade plagg`}
      >
        <div
          className="relative overflow-hidden rounded-2xl aspect-[3/4]"
          // Padding-färgen som upload-flowet skriver runt icke-3:4-bilder
          // (#F7F6F3, se lib/image-resize.ts). Kortets background måste
          // matcha för att paddingen ska smälta in — annars ser portrait-
          // bilder med top/botten-padd ut som om de har vit kant.
          style={{
            backgroundColor: outfit.type === "flatlay" ? "#ffffff" : "#F7F6F3",
          }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <Image
            src={outfit.image}
            alt={buildOutfitAlt(outfit)}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized={outfit.image.startsWith("http")}
          />

          <div
            aria-hidden="true"
            className="absolute top-3 left-3 z-10 flex items-center gap-1.5"
          >
            {outfit.type === "flatlay" && (
              <div className="flex items-center gap-1.5 rounded-full bg-background/70 backdrop-blur-sm px-3 py-1.5">
                <LayoutGrid className="h-3 w-3 text-foreground" />
                <span className="text-[10px] font-medium text-foreground">
                  Flatlay
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 rounded-full bg-background/70 backdrop-blur-sm px-2.5 py-1.5">
              <Tag className="h-3 w-3 text-foreground" />
              <span className="text-[10px] font-medium text-foreground">
                {outfit.tags.length}
              </span>
            </div>
          </div>

          <button
            onClick={handleSave}
            aria-label={saved ? "Ta bort sparad" : "Spara outfit"}
            aria-pressed={saved}
            className={cn(
              "absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 active:scale-90",
              saved
                ? "bg-white text-black"
                : "bg-black/50 text-white hover:bg-black/70",
            )}
          >
            <Bookmark
              className={cn("h-4 w-4", saved && "fill-current")}
              strokeWidth={2}
            />
          </button>

          <div
            aria-hidden="true"
            className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${
              hovering ? "opacity-100" : "opacity-0"
            } pointer-events-none md:group-hover:opacity-100`}
          >
            {outfit.tags.map((tag) => (
              <div
                key={tag.id}
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] ring-2 ring-white/30 transition-transform duration-300 hover:scale-150"
                style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
              />
            ))}

            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-sm font-medium text-white">{outfit.title}</p>
              <p className="text-xs text-white/70 mt-1">
                {outfit.tags.length} taggade plagg
              </p>
            </div>
          </div>
        </div>
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <Link
          href={`/profile/${outfit.creator.username}`}
          aria-label={outfit.creator.displayName}
          className="flex items-center gap-2 group/user"
        >
          <UserAvatar src={outfit.creator.avatar} alt="" size="sm" />
          <span className="text-sm text-foreground-muted group-hover/user:text-foreground transition-colors">
            {outfit.creator.displayName}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            className="flex items-center gap-1 text-foreground-subtle hover:text-foreground transition-colors active:scale-95"
            aria-label={liked ? "Ta bort gilla" : "Gilla"}
            aria-pressed={liked}
          >
            <Heart
              className={`h-4 w-4 ${liked ? "fill-foreground text-foreground" : ""}`}
            />
            <span className="text-xs">{likeCount}</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 text-foreground-subtle hover:text-foreground transition-colors active:scale-95"
            aria-label={saved ? "Ta bort sparad" : "Spara"}
            aria-pressed={saved}
          >
            <Bookmark
              className={cn(
                "h-4 w-4",
                saved && "fill-foreground text-foreground",
              )}
            />
            <span className="text-xs">{saveCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
