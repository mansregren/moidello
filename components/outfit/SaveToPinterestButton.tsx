"use client";

import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Opens Pinterest's official "Pin it" dialog pre-filled with the outfit
 * image, page URL and title — no download step needed since Pinterest
 * accepts a direct image URL. Admin-only: not a feature we want to expose
 * to regular users.
 */
export function SaveToPinterestButton({
  imageUrl,
  pageUrl,
  description,
}: {
  imageUrl: string;
  pageUrl: string;
  description: string;
}) {
  const handleClick = () => {
    const absoluteImage = imageUrl.startsWith("http")
      ? imageUrl
      : `${window.location.origin}${imageUrl}`;
    const absolutePage = pageUrl.startsWith("http")
      ? pageUrl
      : `${window.location.origin}${pageUrl}`;

    const params = new URLSearchParams({
      media: absoluteImage,
      url: absolutePage,
      description,
    });
    window.open(
      `https://www.pinterest.com/pin/create/button/?${params.toString()}`,
      "_blank",
      "noopener,noreferrer,width=750,height=650",
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Save to Pinterest"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        "border-border text-foreground hover:border-foreground/30",
      )}
    >
      <Pin className="h-4 w-4" />
      Pinterest
    </button>
  );
}
