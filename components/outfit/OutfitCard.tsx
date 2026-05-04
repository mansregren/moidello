"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Bookmark, LayoutGrid } from "lucide-react";
import { Outfit } from "@/lib/types";
import { UserAvatar } from "../user/UserAvatar";
import { useState } from "react";

interface OutfitCardProps {
  outfit: Outfit;
}

export function OutfitCard({ outfit }: OutfitCardProps) {
  const [liked, setLiked] = useState(false);
  const [hovering, setHovering] = useState(false);

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
            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Flatlay badge */}
          {outfit.type === "flatlay" && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5">
              <LayoutGrid className="h-3 w-3 text-white" />
              <span className="text-[10px] font-medium text-white">Flatlay</span>
            </div>
          )}

          {/* Hover overlay with tags preview */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${
              hovering ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Tag dots */}
            {outfit.tags.map((tag) => (
              <div
                key={tag.id}
                className="absolute h-3 w-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-transform duration-300 hover:scale-150"
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
            onClick={() => setLiked(!liked)}
            className="flex items-center gap-1 text-foreground-subtle hover:text-white transition-colors active:scale-95"
          >
            <Heart
              className={`h-4 w-4 ${liked ? "fill-white text-white" : ""}`}
            />
            <span className="text-xs">{liked ? outfit.likes + 1 : outfit.likes}</span>
          </button>
          <button className="flex items-center gap-1 text-foreground-subtle hover:text-white transition-colors active:scale-95">
            <Bookmark className="h-4 w-4" />
            <span className="text-xs">{outfit.saves}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
