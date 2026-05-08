"use client";

import { useState, useTransition } from "react";
import { Bookmark, Send } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toggleSavedItem } from "@/app/actions/saved-items";
import { ShareToDmSheet } from "@/components/shared/ShareToDmSheet";
import { cn } from "@/lib/utils";

export function ProduktSaveAndShare({
  itemId,
  initiallySaved,
  shareTitle,
}: {
  itemId: string;
  initiallySaved: boolean;
  shareTitle: string;
}) {
  const { isLoggedIn, requireAuth } = useAuth();
  const [saved, setSaved] = useState(initiallySaved);
  const [shareOpen, setShareOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleToggle = () => {
    if (!isLoggedIn) {
      requireAuth("save");
      return;
    }
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const res = await toggleSavedItem(itemId);
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
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
          saved
            ? "bg-white/10 border-white/40 text-white"
            : "border-border text-white hover:border-white/30",
        )}
      >
        <Bookmark className={cn("h-4 w-4", saved && "fill-white text-white")} />
        {saved ? "Sparat" : "Spara plagg"}
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-full border border-border text-white px-4 py-2.5 text-sm font-medium hover:border-white/30 transition-colors"
      >
        <Send className="h-4 w-4" />
        Skicka till vän
      </button>
      <ShareToDmSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        type="item_share"
        refId={itemId}
        title={shareTitle}
      />
    </>
  );
}
