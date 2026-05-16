"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check, RefreshCw, Download } from "lucide-react";

interface OutfitInput {
  id: string;
  title: string;
  code: string | null;
  image_url: string;
}

interface TagInput {
  id: string;
  brand: string;
  name: string;
  garment: string;
}

interface Caption {
  title: string;
  description: string;
  hashtags: string[];
}

interface Props {
  open: boolean;
  outfit: OutfitInput;
  tags: TagInput[];
  onClose: () => void;
}

function fileName(o: OutfitInput, suffix: string): string {
  const base = o.code ?? o.id.slice(0, 8);
  return `moidello-${base}-${suffix}.png`;
}

async function deliverFiles(files: File[]) {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files })
  ) {
    try {
      await navigator.share({ files });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    await new Promise((r) => setTimeout(r, 150));
  }
}

export function PaketModal({ open, outfit, tags, onClose }: Props) {
  const [caption, setCaption] = useState<Caption | null>(null);
  const [captionLoading, setCaptionLoading] = useState(false);
  const [captionRegen, setCaptionRegen] = useState(false);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const limitedTags = tags.slice(0, 5); // hero + max 5 plagg = 6 bilder

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCaption(null);
    setCaptionError(null);
    setCaptionLoading(true);
    fetch(`/api/admin/tiktok-caption/${outfit.id}`, { cache: "no-store" })
      .then(async (res) => {
        if (cancelled) return;
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.caption) {
          setCaptionError(json?.error ?? `HTTP ${res.status}`);
          return;
        }
        setCaption(json.caption as Caption);
      })
      .catch((e) => {
        if (!cancelled) setCaptionError(String(e));
      })
      .finally(() => {
        if (!cancelled) setCaptionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, outfit.id]);

  async function regenerate() {
    if (captionRegen) return;
    setCaptionRegen(true);
    setCaptionError(null);
    try {
      const res = await fetch(`/api/admin/tiktok-caption/${outfit.id}`, {
        method: "POST",
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.caption) {
        setCaptionError(json?.error ?? `HTTP ${res.status}`);
        return;
      }
      setCaption(json.caption as Caption);
    } catch (e) {
      setCaptionError(String(e));
    } finally {
      setCaptionRegen(false);
    }
  }

  function captionText(): string {
    if (!caption) return "";
    const tags = caption.hashtags.map((h) => `#${h}`).join(" ");
    return `${caption.title}\n\n${caption.description}\n\n${tags}`;
  }

  async function copyCaption() {
    const text = captionText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function downloadAll() {
    if (bulkBusy) return;
    setBulkBusy(true);
    setBulkError(null);
    try {
      const urls: Array<{ url: string; name: string }> = [
        {
          url: `/api/admin/share-image/${outfit.id}`,
          name: fileName(outfit, "1-hero"),
        },
        ...limitedTags.map((t, i) => ({
          url: `/api/admin/share-image/${outfit.id}?variant=plagg&tag=${t.id}`,
          name: fileName(outfit, `${i + 2}-${t.garment.toLowerCase()}`),
        })),
      ];
      const files = await Promise.all(
        urls.map(async ({ url, name }) => {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status} på ${url}`);
          const blob = await res.blob();
          return new File([blob], name, { type: "image/png" });
        }),
      );
      await deliverFiles(files);
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : String(e));
    } finally {
      setBulkBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-background border border-border shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-4 bg-background/95 backdrop-blur border-b border-border">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-foreground-subtle">
              TikTok-paket
            </p>
            <h2 className="text-lg font-medium text-foreground truncate">
              {outfit.title}
              {outfit.code && (
                <span className="ml-2 text-foreground-muted">#{outfit.code}</span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Stäng"
            className="rounded-full p-1.5 text-foreground-muted hover:bg-background-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Caption */}
          <section>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-xs uppercase tracking-[0.25em] text-foreground-subtle">
                Text till posten
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={regenerate}
                  disabled={captionLoading || captionRegen}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background-secondary px-3 py-1.5 text-[11px] font-medium text-foreground-muted hover:text-foreground hover:border-foreground/30 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${
                      captionRegen ? "animate-spin" : ""
                    }`}
                  />
                  Generera om
                </button>
                <button
                  type="button"
                  onClick={copyCaption}
                  disabled={!caption}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-[11px] font-semibold hover:bg-foreground/90 disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" /> Kopierat
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Kopiera
                    </>
                  )}
                </button>
              </div>
            </div>

            {captionLoading && !caption && (
              <p className="text-sm text-foreground-subtle">
                Genererar text…
              </p>
            )}
            {captionError && (
              <p className="text-sm text-red-400">
                Fel: {captionError}
              </p>
            )}
            {caption && (
              <div className="rounded-xl border border-border bg-background-secondary p-4 space-y-3">
                <p className="text-base font-medium text-foreground leading-snug">
                  {caption.title}
                </p>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  {caption.description}
                </p>
                <p className="text-sm text-foreground/90 font-medium">
                  {caption.hashtags.map((h) => `#${h}`).join(" ")}
                </p>
              </div>
            )}
          </section>

          {/* Bilder */}
          <section>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-xs uppercase tracking-[0.25em] text-foreground-subtle">
                Bilder ({limitedTags.length + 1})
              </h3>
              <button
                type="button"
                onClick={downloadAll}
                disabled={bulkBusy}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-xs font-semibold hover:bg-foreground/90 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {bulkBusy
                  ? "Hämtar…"
                  : `Spara alla ${limitedTags.length + 1}`}
              </button>
            </div>
            {bulkError && (
              <p className="mb-3 text-sm text-red-400">{bulkError}</p>
            )}
            <ul className="grid grid-cols-3 gap-2">
              <li className="rounded-xl overflow-hidden bg-background-tertiary aspect-[9/16] relative">
                {/* Hero — använd den server-genererade bilden direkt så
                    thumbnail = exakt vad användaren laddar ner. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/admin/share-image/${outfit.id}`}
                  alt="Hero"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1.5 left-1.5 rounded-full bg-foreground text-background px-2 py-0.5 text-[10px] font-semibold">
                  1
                </span>
              </li>
              {limitedTags.map((t, i) => (
                <li
                  key={t.id}
                  className="rounded-xl overflow-hidden bg-background-tertiary aspect-[9/16] relative"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/admin/share-image/${outfit.id}?variant=plagg&tag=${t.id}`}
                    alt={t.garment}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-foreground text-background px-2 py-0.5 text-[10px] font-semibold">
                    {i + 2}
                  </span>
                  <span className="absolute bottom-1.5 left-1.5 right-1.5 truncate rounded-full bg-background/85 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-foreground">
                    {t.brand}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
