"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Bookmark, LayoutGrid, Tag } from "lucide-react";
import { Outfit } from "@/lib/types";
import { UserAvatar } from "../user/UserAvatar";
import { useOptimistic, useState, useTransition, MouseEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { toggleLike, toggleSave } from "@/app/actions/engagement";

interface OutfitCardProps {
  outfit: Outfit;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function OutfitCard({ outfit }: OutfitCardProps) {
  const { isLoggedIn, requireAuth } = useAuth();
  const [hovering, setHovering] = useState(false);
  const [, startTransition] = useTransition();

  const isPersisted = UUID_RE.test(outfit.id);

  const [likeState, setLikeState] = useOptimistic(
    { liked: false, count: outfit.likes },
    (state, next: boolean) => ({
      liked: next,
      count: state.count + (next ? 1 : -1),
    }),
  );
  const [saveState, setSaveState] = useOptimistic(
    { saved: false, count: outfit.saves },
    (state, next: boolean) => ({
      saved: next,
      count: state.count + (next ? 1 : -1),
    }),
  );

  const handleLike = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      requireAuth("like");
      return;
    }
    if (!isPersisted) {
      // Mock outfit — just flip local state for visual feedback.
      startTransition(() => setLikeState(!likeState.liked));
      return;
    }
    startTransition(async () => {
      setLikeState(!likeState.liked);
      const res = await toggleLike(outfit.id);
      if (!res.ok) setLikeState(likeState.liked);
    });
  };

  const handleSave = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      requireAuth("save");
      return;
    }
    if (!isPersisted) {
      startTransition(() => setSaveState(!saveState.saved));
      return;
    }
    startTransition(async () => {
      setSaveState(!saveState.saved);
      const res = await toggleSave(outfit.id);
      if (!res.ok) setSaveState(saveState.saved);
    });
  };

  return (
    <div className="group">
      <Link href={`/outfit/${outfit.id}`}>
        <div
          className={`relative overflow-hidden rounded-2xl ${
            outfit.type === "flatlay" ? "bg-white" : "bg-background-tertiary"
          }`}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <Image
            src={outfit.image}
            alt={outfit.title}
            width={400}
            height={550}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized={outfit.image.startsWith("http")}
          />

          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
            {outfit.type === "flatlay" && (
              <div className="flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5">
                <LayoutGrid className="h-3 w-3 text-white" />
                <span className="text-[10px] font-medium text-white">
                  Flatlay
                </span>
              </div>
            )}
            <div
              className="flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-sm px-2.5 py-1.5"
              aria-label={`${outfit.tags.length} taggade plagg`}
            >
              <Tag className="h-3 w-3 text-white" />
              <span className="text-[10px] font-medium text-white">
                {outfit.tags.length}
              </span>
            </div>
          </div>

          <button
            onClick={handleSave}
            aria-label={saveState.saved ? "Ta bort sparad" : "Spara outfit"}
            aria-pressed={saveState.saved}
            className={cn(
              "absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 active:scale-90",
              saveState.saved
                ? "bg-white text-black"
                : "bg-black/50 text-white hover:bg-black/70",
            )}
          >
            <Bookmark
              className={cn("h-4 w-4", saveState.saved && "fill-current")}
              strokeWidth={2}
            />
          </button>

          <div
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
          className="flex items-center gap-2 group/user"
        >
          <UserAvatar
            src={outfit.creator.avatar}
            alt={outfit.creator.displayName}
            size="sm"
          />
          <span className="text-sm text-foreground-muted group-hover/user:text-white transition-colors">
            {outfit.creator.displayName}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            className="flex items-center gap-1 text-foreground-subtle hover:text-white transition-colors active:scale-95"
            aria-label={likeState.liked ? "Ta bort gilla" : "Gilla"}
            aria-pressed={likeState.liked}
          >
            <Heart
              className={`h-4 w-4 ${likeState.liked ? "fill-white text-white" : ""}`}
            />
            <span className="text-xs">{likeState.count}</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 text-foreground-subtle hover:text-white transition-colors active:scale-95"
            aria-label={saveState.saved ? "Ta bort sparad" : "Spara"}
            aria-pressed={saveState.saved}
          >
            <Bookmark
              className={cn(
                "h-4 w-4",
                saveState.saved && "fill-white text-white",
              )}
            />
            <span className="text-xs">{saveState.count}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
