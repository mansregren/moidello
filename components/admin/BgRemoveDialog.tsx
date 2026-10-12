"use client";

/* eslint-disable @next/next/no-img-element -- storage image processed on a canvas */

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Undo2 } from "lucide-react";

/**
 * Manual background removal for a plaggbank photo. Flood-fills from the
 * image border through pixels close to the background colour and makes
 * them transparent — instant preview in the browser, tolerance slider, and
 * click-to-remove for pockets of background the fill can't reach (inside
 * a watch strap, between arms). It's a manual tool on purpose: automatic
 * removal ate white garments on light-grey backgrounds.
 */
export function BgRemoveDialog({
  src,
  title,
  onCancel,
  onDone,
}: {
  src: string;
  title: string;
  onCancel: () => void;
  onDone: (file: File) => Promise<void>;
}) {
  const sourceRef = useRef<ImageData | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [tolerance, setTolerance] = useState(14);
  const [seeds, setSeeds] = useState<Array<{ x: number; y: number }>>([]);
  const [removedShare, setRemovedShare] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      sourceRef.current = ctx.getImageData(0, 0, c.width, c.height);
      setReady(true);
    };
    img.onerror = () => setError("Kunde inte ladda bilden.");
    img.src = src;
  }, [src]);

  const compute = useCallback((): ImageData | null => {
    const source = sourceRef.current;
    if (!source) return null;
    const { width: w, height: h, data } = source;
    const out = new ImageData(new Uint8ClampedArray(data), w, h);
    const o = out.data;
    const removed = new Uint8Array(w * h);
    const stack: number[] = [];

    // Each fill compares against the colour at its own seed, so a clicked
    // pocket with a slightly different shade still clears cleanly.
    const fill = (starts: number[], ref: [number, number, number]) => {
      const near = (i: number) => {
        const p = i * 4;
        return (
          data[p + 3] > 0 &&
          Math.abs(data[p] - ref[0]) <= tolerance &&
          Math.abs(data[p + 1] - ref[1]) <= tolerance &&
          Math.abs(data[p + 2] - ref[2]) <= tolerance
        );
      };
      for (const s of starts) {
        if (!removed[s] && near(s)) {
          removed[s] = 1;
          stack.push(s);
        }
      }
      while (stack.length) {
        const i = stack.pop()!;
        const x = i % w;
        if (x > 0 && !removed[i - 1] && near(i - 1)) { removed[i - 1] = 1; stack.push(i - 1); }
        if (x < w - 1 && !removed[i + 1] && near(i + 1)) { removed[i + 1] = 1; stack.push(i + 1); }
        if (i >= w && !removed[i - w] && near(i - w)) { removed[i - w] = 1; stack.push(i - w); }
        if (i < w * (h - 1) && !removed[i + w] && near(i + w)) { removed[i + w] = 1; stack.push(i + w); }
      }
    };

    const colourAt = (i: number): [number, number, number] => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
    const corners = [0, w - 1, (h - 1) * w, h * w - 1].map(colourAt);
    const bg = [0, 1, 2].map((k) => corners.reduce((s, c) => s + c[k], 0) / 4) as [number, number, number];

    const border: number[] = [];
    for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
    for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1);
    fill(border, bg);
    for (const s of seeds) {
      const i = Math.round(s.y) * w + Math.round(s.x);
      fill([i], colourAt(i));
    }

    // Soft edge: a removed pixel is fully clear; a kept pixel next to a
    // removed one gets half alpha so the cut doesn't look stencilled.
    let count = 0;
    for (let i = 0; i < w * h; i++) {
      if (removed[i]) {
        o[i * 4 + 3] = 0;
        count++;
      } else {
        const x = i % w;
        const edge =
          (x > 0 && removed[i - 1]) ||
          (x < w - 1 && removed[i + 1]) ||
          (i >= w && removed[i - w]) ||
          (i < w * (h - 1) && removed[i + w]);
        if (edge) o[i * 4 + 3] = Math.min(o[i * 4 + 3], 140);
      }
    }
    setRemovedShare(count / (w * h));
    return out;
  }, [tolerance, seeds]);

  // Re-render the preview whenever the settings change.
  useEffect(() => {
    if (!ready) return;
    const result = compute();
    const c = previewRef.current;
    if (!result || !c) return;
    c.width = result.width;
    c.height = result.height;
    c.getContext("2d")!.putImageData(result, 0, 0);
  }, [ready, compute]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const addSeed = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = e.currentTarget;
    const box = c.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * c.width;
    const y = ((e.clientY - box.top) / box.height) * c.height;
    setSeeds((s) => [...s, { x, y }]);
  };

  const save = async () => {
    const c = previewRef.current;
    if (!c) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.95));
      if (!blob) throw new Error("Kunde inte skapa bilden.");
      await onDone(new File([blob], "cutout.webp", { type: blob.type || "image/webp" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel.");
      setBusy(false);
    }
  };

  const tooMuch = removedShare > 0.9;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Ta bort bakgrund: ${title}`}
      onClick={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-background p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Ta bort bakgrund</h2>
            <p className="text-xs text-foreground-muted">
              Bakgrunden närmast kanterna tas bort automatiskt. Blev det bakgrund kvar, till
              exempel innanför ett armband, klicka på den. Äter den in i plagget, sänk
              toleransen.
            </p>
          </div>
          <button type="button" onClick={onCancel} disabled={busy} aria-label="Stäng" className="text-foreground-subtle hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <figure>
            <figcaption className="text-xs text-foreground-subtle mb-1">Före</figcaption>
            <div className="rounded-xl border border-border bg-white grid place-items-center h-[50vh]">
              <img src={src} alt="" crossOrigin="anonymous" className="max-h-full max-w-full object-contain" />
            </div>
          </figure>
          <figure>
            <figcaption className="text-xs text-foreground-subtle mb-1">Efter (klicka på kvarvarande bakgrund)</figcaption>
            <div className="rounded-xl border border-border grid place-items-center h-[50vh] bg-[#F5F3EE]">
              {ready ? (
                <canvas
                  ref={previewRef}
                  onClick={addSeed}
                  className="max-h-full max-w-full cursor-crosshair"
                  style={{ objectFit: "contain" }}
                />
              ) : (
                <p className="text-xs text-foreground-subtle">{error ?? "Laddar…"}</p>
              )}
            </div>
          </figure>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-3 text-sm text-foreground-muted">
            Tolerans
            <input
              type="range"
              min={2}
              max={60}
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="w-40"
            />
            <span className="w-6 text-foreground tabular-nums">{tolerance}</span>
          </label>
          {seeds.length > 0 && (
            <button
              type="button"
              onClick={() => setSeeds((s) => s.slice(0, -1))}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background-secondary"
            >
              <Undo2 className="h-3.5 w-3.5" /> Ångra klick ({seeds.length})
            </button>
          )}
          <p className={`text-xs ${tooMuch ? "text-red-500" : "text-foreground-subtle"}`}>
            {Math.round(removedShare * 100)} % borttaget
            {tooMuch ? ". Det ser ut som att plagget försvann, sänk toleransen." : ""}
          </p>
        </div>

        {error && ready && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary disabled:opacity-50"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy || !ready || tooMuch}
            className="rounded-full bg-foreground text-background px-5 py-2 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50"
          >
            {busy ? "Sparar…" : "Spara"}
          </button>
        </div>
      </div>
    </div>
  );
}
