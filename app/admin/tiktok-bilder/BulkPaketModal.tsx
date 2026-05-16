"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check, RefreshCw, Download } from "lucide-react";

interface OutfitInput {
  id: string;
  title: string;
  code: string | null;
  image_url: string;
}

interface Caption {
  title: string;
  description: string;
  hashtags: string[];
}

interface Props {
  open: boolean;
  outfits: OutfitInput[];
  onClose: () => void;
}

function heroFileName(o: OutfitInput): string {
  return `moidello-${o.code ?? o.id.slice(0, 8)}-hero.png`;
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

export function BulkPaketModal({ open, outfits, onClose }: Props) {
  const [caption, setCaption] = useState<Caption | null>(null);
  const [loading, setLoading] = useState(false);
  const [regen, setRegen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || outfits.length === 0) return;
    let cancelled = false;
    setCaption(null);
    setError(null);
    setLoading(true);
    fetch(`/api/admin/tiktok-caption/bulk`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outfitIds: outfits.map((o) => o.id) }),
      cache: "no-store",
    })
      .then(async (res) => {
        if (cancelled) return;
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.caption) {
          setError(json?.error ?? `HTTP ${res.status}`);
          return;
        }
        setCaption(json.caption as Caption);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, outfits]);

  async function regenerate() {
    if (regen || outfits.length === 0) return;
    setRegen(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tiktok-caption/bulk`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outfitIds: outfits.map((o) => o.id) }),
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.caption) {
        setError(json?.error ?? `HTTP ${res.status}`);
        return;
      }
      setCaption(json.caption as Caption);
    } catch (e) {
      setError(String(e));
    } finally {
      setRegen(false);
    }
  }

  async function copyTitle() {
    if (!caption) return;
    try {
      await navigator.clipboard.writeText(caption.title);
      setCopiedTitle(true);
      setTimeout(() => setCopiedTitle(false), 1500);
    } catch {
      // ignore
    }
  }

  async function copyBody() {
    if (!caption) return;
    const tags = caption.hashtags.map((h) => `#${h}`).join(" ");
    const text = `${caption.description}\n\n${tags}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 1500);
    } catch {
      // ignore
    }
  }

  async function downloadAll() {
    if (bulkBusy || outfits.length === 0) return;
    setBulkBusy(true);
    setBulkError(null);
    try {
      const files = await Promise.all(
        outfits.map(async (o) => {
          const res = await fetch(`/api/admin/share-image/${o.id}`, {
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`HTTP ${res.status} på ${o.id}`);
          const blob = await res.blob();
          return new File([blob], heroFileName(o), { type: "image/png" });
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
              {outfits.length} outfits valda
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
          {/* Rubrik */}
          <section>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-xs uppercase tracking-[0.25em] text-foreground-subtle">
                Rubrik
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={regenerate}
                  disabled={loading || regen}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background-secondary px-3 py-1.5 text-[11px] font-medium text-foreground-muted hover:text-foreground hover:border-foreground/30 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${regen ? "animate-spin" : ""}`}
                  />
                  Generera om
                </button>
                <button
                  type="button"
                  onClick={copyTitle}
                  disabled={!caption}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-[11px] font-semibold hover:bg-foreground/90 disabled:opacity-50"
                >
                  {copiedTitle ? (
                    <>
                      <Check className="h-3 w-3" /> Kopierat
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Kopiera rubrik
                    </>
                  )}
                </button>
              </div>
            </div>
            {loading && !caption && (
              <p className="text-sm text-foreground-subtle">
                Genererar text…
              </p>
            )}
            {error && <p className="text-sm text-red-400">Fel: {error}</p>}
            {caption && (
              <div className="rounded-xl border border-border bg-background-secondary p-4">
                <p className="text-base font-medium text-foreground leading-snug">
                  {caption.title}
                </p>
              </div>
            )}
          </section>

          {/* Beskrivning + hashtags */}
          {caption && (
            <section>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-xs uppercase tracking-[0.25em] text-foreground-subtle">
                  Beskrivning + hashtags
                </h3>
                <button
                  type="button"
                  onClick={copyBody}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-[11px] font-semibold hover:bg-foreground/90"
                >
                  {copiedBody ? (
                    <>
                      <Check className="h-3 w-3" /> Kopierat
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Kopiera beskrivning
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-xl border border-border bg-background-secondary p-4 space-y-3">
                <p className="text-sm text-foreground-muted leading-relaxed whitespace-pre-line">
                  {caption.description}
                </p>
                <p className="text-sm text-foreground/90 font-medium">
                  {caption.hashtags.map((h) => `#${h}`).join(" ")}
                </p>
              </div>
            </section>
          )}

          {/* Bilder */}
          <section>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-xs uppercase tracking-[0.25em] text-foreground-subtle">
                Bilder ({outfits.length})
              </h3>
              <button
                type="button"
                onClick={downloadAll}
                disabled={bulkBusy}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-xs font-semibold hover:bg-foreground/90 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {bulkBusy ? "Hämtar…" : `Spara alla ${outfits.length}`}
              </button>
            </div>
            {bulkError && (
              <p className="mb-3 text-sm text-red-400">{bulkError}</p>
            )}
            <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {outfits.map((o, i) => (
                <li
                  key={o.id}
                  className="rounded-xl overflow-hidden bg-background-tertiary aspect-[9/16] relative"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/admin/share-image/${o.id}`}
                    alt={o.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 rounded-full bg-foreground text-background px-2 py-0.5 text-[10px] font-semibold">
                    {i + 1}
                  </span>
                  {o.code && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-background/85 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-foreground">
                      #{o.code}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
