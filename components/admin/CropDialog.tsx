"use client";

/* eslint-disable @next/next/no-img-element -- storage image, cropped 1:1 on a canvas */

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Handle = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const MIN = 40; // natural px

/**
 * Free-form crop for a plaggbank photo. Works in the image's natural pixel
 * space and hands back a WebP of the cropped region; the caller uploads it
 * (replaceCatalogImage), where it's normalised like any other photo.
 */
export function CropDialog({
  src,
  title,
  onCancel,
  onCropped,
}: {
  src: string;
  title: string;
  onCancel: () => void;
  onCropped: (file: File) => Promise<void>;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [displayW, setDisplayW] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ handle: Handle; x: number; y: number; start: Box } | null>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDisplayW(el.clientWidth || 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, [natural]);

  // Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const k = natural ? displayW / natural.w : 1; // natural → display

  const onLoad = () => {
    const el = imgRef.current!;
    const n = { w: el.naturalWidth, h: el.naturalHeight };
    setNatural(n);
    // Start with a slightly inset box so the handles are easy to grab.
    setBox({ x: n.w * 0.05, y: n.h * 0.05, w: n.w * 0.9, h: n.h * 0.9 });
  };

  const start = (e: React.PointerEvent, handle: Handle) => {
    if (!box) return;
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { handle, x: e.clientX, y: e.clientY, start: box };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !natural) return;
    const dx = (e.clientX - d.x) / k;
    const dy = (e.clientY - d.y) / k;
    let { x, y, w, h } = d.start;
    const right = x + w;
    const bottom = y + h;
    if (d.handle === "move") {
      x = Math.min(Math.max(0, x + dx), natural.w - w);
      y = Math.min(Math.max(0, y + dy), natural.h - h);
    } else {
      if (d.handle.includes("w")) {
        x = Math.min(Math.max(0, x + dx), right - MIN);
        w = right - x;
      }
      if (d.handle.includes("e")) w = Math.min(Math.max(MIN, w + dx), natural.w - x);
      if (d.handle.includes("n")) {
        y = Math.min(Math.max(0, y + dy), bottom - MIN);
        h = bottom - y;
      }
      if (d.handle.includes("s")) h = Math.min(Math.max(MIN, h + dy), natural.h - y);
    }
    setBox({ x, y, w, h });
  };

  const save = async () => {
    if (!box || !imgRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(box.w);
      canvas.height = Math.round(box.h);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas stöds inte.");
      ctx.drawImage(imgRef.current, box.x, box.y, box.w, box.h, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.92));
      if (!blob) throw new Error("Kunde inte beskära bilden.");
      await onCropped(new File([blob], "crop.webp", { type: "image/webp" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel.");
      setBusy(false);
    }
  };

  const handles: Array<{ h: Handle; cls: string; cursor: string }> = [
    { h: "nw", cls: "-left-1.5 -top-1.5", cursor: "nwse-resize" },
    { h: "ne", cls: "-right-1.5 -top-1.5", cursor: "nesw-resize" },
    { h: "sw", cls: "-left-1.5 -bottom-1.5", cursor: "nesw-resize" },
    { h: "se", cls: "-right-1.5 -bottom-1.5", cursor: "nwse-resize" },
    { h: "n", cls: "left-1/2 -ml-1.5 -top-1.5", cursor: "ns-resize" },
    { h: "s", cls: "left-1/2 -ml-1.5 -bottom-1.5", cursor: "ns-resize" },
    { h: "w", cls: "top-1/2 -mt-1.5 -left-1.5", cursor: "ew-resize" },
    { h: "e", cls: "top-1/2 -mt-1.5 -right-1.5", cursor: "ew-resize" },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Beskär ${title}`}
      onClick={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-background p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Beskär bild</h2>
            <p className="text-xs text-foreground-muted">
              Dra i hörnen eller kanterna. Dra inuti rutan för att flytta den.
            </p>
          </div>
          <button type="button" onClick={onCancel} disabled={busy} aria-label="Stäng" className="text-foreground-subtle hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="relative mx-auto w-fit overflow-hidden select-none touch-none bg-[repeating-conic-gradient(#eee_0%_25%,#fff_0%_50%)] [background-size:16px_16px]"
          onPointerMove={onMove}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          <img
            ref={imgRef}
            src={src}
            alt=""
            crossOrigin="anonymous"
            draggable={false}
            onLoad={onLoad}
            className="block max-h-[65vh] max-w-full w-auto"
          />
          {box && natural && (
            <div
              onPointerDown={(e) => start(e, "move")}
              className="absolute border-2 border-white cursor-move"
              style={{
                left: box.x * k,
                top: box.y * k,
                width: box.w * k,
                height: box.h * k,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              }}
            >
              {/* rule-of-thirds guides */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/25" />
                ))}
              </div>
              {handles.map((hd) => (
                <span
                  key={hd.h}
                  onPointerDown={(e) => start(e, hd.h)}
                  className={`absolute h-3 w-3 rounded-sm bg-white border border-black/40 ${hd.cls}`}
                  style={{ cursor: hd.cursor }}
                />
              ))}
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-foreground-subtle">
            {box ? `${Math.round(box.w)} × ${Math.round(box.h)} px` : "Laddar…"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => natural && setBox({ x: 0, y: 0, w: natural.w, h: natural.h })}
              disabled={busy || !natural}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary disabled:opacity-50"
            >
              Hela bilden
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy || !box}
              className="rounded-full bg-foreground text-background px-5 py-2 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50"
            >
              {busy ? "Sparar…" : "Spara beskärning"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
