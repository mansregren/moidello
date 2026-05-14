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
          className={`relative overflow-hidden rounded-2xl aspect-[3/4] ${
            outfit.type === "flatlay" ? "bg-foreground" : "bg-background-tertiary"
          }`}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <Image
            src={outfit.image}
            alt={outfit.title}
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
                ? "bg-foreground text-background"
                : "bg-background/50 text-foreground hover:bg-background/70",
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
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow-[0_0_10px_rgba(255,255,255,0.5)] ring-2 ring-foreground/30 transition-transform duration-300 hover:scale-150"
                style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
              />
            ))}

            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-sm font-medium text-foreground">{outfit.title}</p>
              <p className="text-xs text-foreground/70 mt-1">
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
