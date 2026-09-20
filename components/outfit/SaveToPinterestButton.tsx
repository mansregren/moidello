"use client";

import { useEffect, useState } from "react";
import { Pin, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Same idea as SaveForTikTokButton, but requests the Pinterest-ratio
 * (2:3, 2x res) export from the share-image route instead of the 9:16
 * one, with the same dots + tag labels baked in. Downloads the file
 * directly via <a download> instead of the share sheet — this is an
 * admin-only desktop tool, not a mobile share flow. Admin-only gating
 * lives in OutfitDetail.
 */
export function SaveToPinterestButton({ outfitId }: { outfitId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFile(null);
    setLoadFailed(false);
    fetch(`/api/share-image/${outfitId}?format=pinterest`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (!cancelled) {
          setFile(new File([blob], `moidello-pinterest-${outfitId.slice(0, 8)}.png`, {
            type: "image/png",
          }));
        }
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [outfitId, attempt]);

  const loading = !file && !loadFailed;

  function handleClick() {
    if (busy || loading) return;
    if (loadFailed) {
      setAttempt((n) => n + 1);
      return;
    }
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
        disabled={busy || loading}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          "border-border text-foreground hover:border-foreground/30 disabled:opacity-50",
        )}
      >
        {busy || loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : loadFailed ? (
          <RotateCcw className="h-4 w-4" />
        ) : (
          <Pin className="h-4 w-4" />
        )}
        {loadFailed ? "Try again" : "Save for Pinterest"}
      </button>
      {error && (
        <p className="max-w-xs text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
