"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Native share on devices that support it; otherwise copies the link to
 * the clipboard and shows a brief "Länk kopierad" confirmation.
 */
export function ShareButton({
  url,
  title,
  text,
  variant = "outline",
  label = "Dela",
  className,
}: {
  url: string;
  title?: string;
  text?: string;
  variant?: "outline" | "solid" | "ghost";
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const absolute = url.startsWith("http")
      ? url
      : typeof window !== "undefined"
        ? `${window.location.origin}${url}`
        : url;

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text, url: absolute });
        return;
      } catch (err) {
        // User cancelled — fall through to clipboard fallback
        if ((err as DOMException)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last-resort fallback: open mailto/SMS-style prompt? Just no-op.
    }
  };

  const base =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors active:scale-[0.98]";
  const styles = {
    outline:
      "border border-border text-foreground hover:border-foreground/30",
    solid: "bg-foreground text-background hover:bg-foreground/90",
    ghost: "text-foreground-muted hover:text-foreground",
  }[variant];

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Dela länk"
      className={cn(base, styles, className)}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Länk kopierad
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}
