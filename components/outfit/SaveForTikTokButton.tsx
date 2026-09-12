"use client";

import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { shareOrSavePhotos } from "@/lib/share-files";
import { cn } from "@/lib/utils";

/**
 * Downloads/shares a white-letterboxed 9:16 export of the outfit photo
 * (dots + tag labels baked in) so posting straight to TikTok/Stories
 * doesn't get cropped or padded with black bars. Pre-fetches the file on
 * mount so the click handler can call shareOrSavePhotos without an await
 * in between — iOS Safari drops the share sheet otherwise.
 */
export function SaveForTikTokButton({ outfitId }: { outfitId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/share-image/${outfitId}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (!cancelled) {
          setFile(new File([blob], `moidello-${outfitId.slice(0, 8)}.png`, {
            type: "image/png",
          }));
        }
      })
      .catch(() => {
        // Silent — button just stays disabled if the export failed to load.
      });
    return () => {
      cancelled = true;
    };
  }, [outfitId]);

  async function handleClick() {
    if (busy || !file) return;
    setBusy(true);
    setError(null);
    try {
      await shareOrSavePhotos([file]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || !file}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          "border-border text-foreground hover:border-foreground/30 disabled:opacity-50",
        )}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Save for TikTok
      </button>
      {error && (
        <p className="max-w-xs text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
