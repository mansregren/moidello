"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Bookmark, LayoutGrid, Tag } from "lucide-react";
import { Outfit } from "@/lib/types";
import { UserAvatar } from "../user/UserAvatar";
import { useState, MouseEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface OutfitCardProps {
  outfit: Outfit;
}

export function OutfitCard({ outfit }: OutfitCardProps) {
  const { requireAuth } = useAuth();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hovering, setHovering] = useState(false);

  const handleSave = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireAuth("save")) return;
    setSaved((s) => !s);
  };

  const handleLike = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireAuth("like")) return;
    setLiked((l) => !l);
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
          />

          {/* Top-left badges */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
            {outfit.type === "flatlay" && (
              <div className="flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5">
                <LayoutGrid className="h-3 w-3 text-white" />
                <span className="text-[10px] font-medium text-white">Flatlay</span>
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

          {/* Save toggle */}
          <button
            onClick={handleSave}
            aria-label={saved ? "Ta bort sparad" : "Spara outfit"}
            aria-pressed={saved}
            className={cn(
              "absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-300 active:scale-90",
              saved
                ? "bg-white text-black"
                : "bg-black/50 text-white hover:bg-black/70"
            )}
          >
            <Bookmark
              className={cn("h-4 w-4", saved && "fill-current")}
              strokeWidth={2}
            />
          </button>

          {/* Hover overlay */}
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

      {/* Bottom info */}
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
            aria-label={liked ? "Ta bort gilla" : "Gilla"}
            aria-pressed={liked}
          >
            <Heart
              className={`h-4 w-4 ${liked ? "fill-white text-white" : ""}`}
            />
            <span className="text-xs">
              {liked ? outfit.likes + 1 : outfit.likes}
            </span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 text-foreground-subtle hover:text-white transition-colors active:scale-95"
            aria-label={saved ? "Ta bort sparad" : "Spara"}
            aria-pressed={saved}
          >
            <Bookmark
              className={cn("h-4 w-4", saved && "fill-white text-white")}
            />
            <span className="text-xs">
              {saved ? outfit.saves + 1 : outfit.saves}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
