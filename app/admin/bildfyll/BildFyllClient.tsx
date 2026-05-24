"use client";

import { useState } from "react";
import { recropOutfitImage } from "@/app/actions/admin-content";

export interface FillRow {
  id: string;
  title: string;
  imageUrl: string;
}

// Legacy upload padding colour (#F7F6F3) + a tolerance for JPEG noise.
const PAD = { r: 247, g: 246, b: 243 };
const TOL = 14;

function isPad(r: number, g: number, b: number): boolean {
  return (
    Math.abs(r - PAD.r) <= TOL &&
    Math.abs(g - PAD.g) <= TOL &&
    Math.abs(b - PAD.b) <= TOL
  );
}

/**
 * Detect a uniform #F7F6F3 border on the image and return a cropped JPEG that
 * removes it. Returns null when there's no meaningful padding to strip (so the
 * image is left untouched).
 */
async function cropPadding(imageUrl: string): Promise<File | null> {
  const res = await fetch(imageUrl, { mode: "cors" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const w = bitmap.width;
  const h = bitmap.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h);

  const px = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2]] as const;
  };
  // Sample ~40 points across a line; treat it as padding only if (almost) all
  // sampled pixels match the pad colour.
  const lineIsPad = (coords: Array<readonly [number, number]>) => {
    let bad = 0;
    for (const [x, y] of coords) {
      const [r, g, b] = px(x, y);
      if (!isPad(r, g, b)) bad++;
      if (bad > 1) return false;
    }
    return true;
  };
  const rowCoords = (y: number) => {
    const out: Array<readonly [number, number]> = [];
    for (let s = 0; s < 40; s++) out.push([Math.floor((s / 39) * (w - 1)), y]);
    return out;
  };
  const colCoords = (x: number) => {
    const out: Array<readonly [number, number]> = [];
    for (let s = 0; s < 40; s++) out.push([x, Math.floor((s / 39) * (h - 1))]);
    return out;
  };

  let top = 0;
  while (top < h && lineIsPad(rowCoords(top))) top++;
  let bottom = h - 1;
  while (bottom > top && lineIsPad(rowCoords(bottom))) bottom--;
  let left = 0;
  while (left < w && lineIsPad(colCoords(left))) left++;
  let right = w - 1;
  while (right > left && lineIsPad(colCoords(right))) right--;

  const cropW = right - left + 1;
  const cropH = bottom - top + 1;

  // No meaningful padding, or detection collapsed the image → leave untouched.
  if (cropW >= w - 2 && cropH >= h - 2) return null;
  if (cropW < w * 0.3 || cropH < h * 0.3) return null;

  const out = document.createElement("canvas");
  out.width = cropW;
  out.height = cropH;
  const octx = out.getContext("2d");
  if (!octx) return null;
  octx.drawImage(bitmap, left, top, cropW, cropH, 0, 0, cropW, cropH);

  const outBlob = await new Promise<Blob | null>((resolve) =>
    out.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!outBlob) return null;
  return new File([outBlob], "fill.jpg", { type: "image/jpeg" });
}

type Status = "idle" | "running" | "done";

export function BildFyllClient({ rows }: { rows: FillRow[] }) {
  const [status, setStatus] = useState<Status>("idle");
  const [done, setDone] = useState(0);
  const [changed, setChanged] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const run = async () => {
    setStatus("running");
    setDone(0);
    setChanged(0);
    setSkipped(0);
    setErrors([]);
    let c = 0;
    let s = 0;
    const errs: string[] = [];

    for (const row of rows) {
      try {
        const file = await cropPadding(row.imageUrl);
        if (!file) {
          s++;
          setSkipped(s);
        } else {
          const fd = new FormData();
          fd.set("image", file);
          const res = await recropOutfitImage(row.id, fd);
          if (res.ok) {
            c++;
            setChanged(c);
          } else {
            errs.push(`${row.title}: ${res.error ?? "fel"}`);
            setErrors([...errs]);
          }
        }
      } catch (e) {
        errs.push(`${row.title}: ${e instanceof Error ? e.message : "fel"}`);
        setErrors([...errs]);
      }
      setDone((d) => d + 1);
    }
    setStatus("done");
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={run}
        disabled={status === "running" || rows.length === 0}
        className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-60"
      >
        {status === "running"
          ? `Kör… ${done}/${rows.length}`
          : status === "done"
            ? "Kör igen"
            : `Fyll ${rows.length} bilder`}
      </button>

      {(status === "running" || status === "done") && (
        <div className="rounded-2xl border border-border bg-background-secondary p-4 text-sm">
          <p className="text-foreground">
            Klar: {done}/{rows.length} · Beskurna: {changed} · Orörda (ingen
            padding): {skipped} · Fel: {errors.length}
          </p>
          {status === "done" && (
            <p className="mt-2 text-xs text-foreground-muted">
              Färdigt. Ladda om sidorna för att se de fyllda bilderna (cachen
              uppdateras inom några minuter på publika sidor).
            </p>
          )}
          {errors.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-red-500">
              {errors.slice(0, 20).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
