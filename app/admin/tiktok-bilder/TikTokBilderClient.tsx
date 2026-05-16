"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Hash, Check, Sparkles } from "lucide-react";
import { PaketModal } from "./PaketModal";
import { BulkPaketModal } from "./BulkPaketModal";

interface OutfitTagLite {
  id: string;
  brand: string;
  name: string;
  garment: string;
}

interface OutfitListRow {
  id: string;
  title: string;
  image_url: string;
  code: string | null;
  username: string;
  tags: OutfitTagLite[];
}

interface Props {
  outfits: OutfitListRow[];
}

function fileNameFor(o: OutfitListRow): string {
  return `moidello-${o.code ?? o.id.slice(0, 8)}-9x16.png`;
}

async function fetchPng(o: OutfitListRow): Promise<File> {
  const res = await fetch(`/api/admin/share-image/${o.id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return new File([blob], fileNameFor(o), { type: "image/png" });
}

/**
 * iOS-Safari kräver Web Share API för att en bild ska kunna landa i
 * Photos (annars hamnar den i Files via <a download>). På desktop
 * stödjer ingen browser canShare-files än, så vi faller tillbaka till
 * sekventiell nedladdning. Cancel från share-sheet är inte ett fel.
 */
async function deliverFiles(files: File[]): Promise<void> {
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
      // Annat share-fel — falla tillbaka till download
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
    // Lite andrum mellan downloads — annars klipps browsern av efter ~10
    await new Promise((r) => setTimeout(r, 150));
  }
}

export function TikTokBilderClient({ outfits }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paketOutfit, setPaketOutfit] = useState<OutfitListRow | null>(null);
  const [bulkPaketOpen, setBulkPaketOpen] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(outfits.map((o) => o.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function downloadOne(o: OutfitListRow) {
    if (busyId) return;
    setBusyId(o.id);
    setError(null);
    try {
      const file = await fetchPng(o);
      await deliverFiles([file]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte hämta bilden");
    } finally {
      setBusyId(null);
    }
  }

  async function downloadSelected() {
    if (bulkBusy || selected.size === 0) return;
    setBulkBusy(true);
    setError(null);
    try {
      const targets = outfits.filter((o) => selected.has(o.id));
      // Hämta alla parallellt — share-API och download tolererar batchen
      const files = await Promise.all(targets.map(fetchPng));
      await deliverFiles(files);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte hämta bilderna");
    } finally {
      setBulkBusy(false);
    }
  }

  const allSelected = selected.size > 0 && selected.size === outfits.length;

  return (
    <>
      <div className="sticky top-16 md:top-20 z-30 -mx-4 sm:mx-0 bg-background/90 backdrop-blur border-b border-border px-4 sm:px-0 py-3 mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={allSelected ? clearSelection : selectAll}
          className="text-xs text-foreground-muted hover:text-foreground underline-offset-2 hover:underline"
        >
          {allSelected ? "Avmarkera alla" : `Markera alla (${outfits.length})`}
        </button>
        <span className="text-xs text-foreground-subtle">
          {selected.size} valda
        </span>
        <div className="ml-auto flex items-center gap-2">
          {selected.size > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-foreground-muted hover:text-foreground"
            >
              Rensa
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (selected.size === 1) {
                const id = Array.from(selected)[0];
                const o = outfits.find((x) => x.id === id);
                if (o) setPaketOutfit(o);
              } else if (selected.size > 1) {
                setBulkPaketOpen(true);
              }
            }}
            disabled={selected.size === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-xs font-semibold hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {selected.size > 1
              ? `Paket (${selected.size})`
              : "Paket"}
          </button>
          <button
            type="button"
            onClick={downloadSelected}
            disabled={bulkBusy || selected.size === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background-secondary px-4 py-2 text-xs font-semibold text-foreground hover:border-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-3.5 w-3.5" />
            {bulkBusy
              ? "Hämtar…"
              : selected.size > 1
                ? `Hero × ${selected.size}`
                : "Hero"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/[0.05] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {outfits.map((o) => {
          const isSelected = selected.has(o.id);
          const isBusy = busyId === o.id;
          return (
            <li
              key={o.id}
              className={`rounded-2xl border overflow-hidden flex flex-col transition-colors ${
                isSelected
                  ? "border-foreground/60 bg-background-secondary"
                  : "border-border bg-background-secondary"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(o.id)}
                aria-pressed={isSelected}
                className="relative aspect-[4/5] bg-background-tertiary text-left"
              >
                <Image
                  src={o.image_url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                  unoptimized={o.image_url.startsWith("http")}
                />
                {o.code && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-foreground">
                    <Hash className="h-3 w-3" />
                    {o.code}
                  </span>
                )}
                <span
                  aria-hidden
                  className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border ${
                    isSelected
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background/85 backdrop-blur border-border"
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
              <div className="p-3 flex-1 flex flex-col gap-2">
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {o.title}
                </p>
                <p className="text-[11px] text-foreground-subtle line-clamp-1">
                  @{o.username}
                </p>
                <div className="mt-auto flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaketOutfit(o)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-semibold hover:bg-foreground/90"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Paket
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadOne(o)}
                      disabled={isBusy}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-foreground/30 disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {isBusy ? "Hämtar…" : "Hero"}
                    </button>
                    <Link
                      href={`/admin/inlagg/${o.id}`}
                      className="text-[11px] text-foreground-muted hover:text-foreground"
                    >
                      Öppna →
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {paketOutfit && (
        <PaketModal
          open={!!paketOutfit}
          outfit={paketOutfit}
          tags={paketOutfit.tags}
          onClose={() => setPaketOutfit(null)}
        />
      )}

      {bulkPaketOpen && (
        <BulkPaketModal
          open={bulkPaketOpen}
          outfits={outfits.filter((o) => selected.has(o.id))}
          onClose={() => setBulkPaketOpen(false)}
        />
      )}
    </>
  );
}
