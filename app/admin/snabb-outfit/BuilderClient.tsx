"use client";

/* eslint-disable @next/next/no-img-element -- storage images drawn 1:1 with the export canvas */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  Minus,
  Plus,
  ArrowUpToLine,
  ArrowDownToLine,
  Trash2,
  LayoutGrid,
  RotateCw,
  RotateCcw,
  Crop,
  Search,
} from "lucide-react";
import { createOutfit } from "@/app/skapa/actions";
import { replaceCatalogImage } from "@/app/actions/catalog";
import { CropDialog } from "@/components/admin/CropDialog";
import { CatalogThumb } from "@/components/admin/CatalogThumb";
import { GARMENTS, GARMENTS_HERR, type Gender } from "@/lib/garments";
import {
  CANVAS_H,
  CANVAS_W,
  autoLayout,
  suggestTitle,
  type Rect,
} from "@/lib/catalog/layout";
import type { CatalogItem } from "@/lib/catalog/types";

const CATEGORIES = [
  "Streetwear",
  "Minimalism",
  "Vintage",
  "Casual",
  "Formal",
  "Sporty",
  "Preppy",
];

const BACKGROUNDS = [
  { name: "Off-white", hex: "#F5F3EE" },
  { name: "Vit", hex: "#FFFFFF" },
  { name: "Sand", hex: "#ECE6DC" },
  { name: "Grå", hex: "#E9E9E7" },
];

const GARMENT_ORDER = Array.from(new Set<string>([...GARMENTS_HERR, ...GARMENTS]));
const RADIUS = 28;

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-foreground/20";
const labelCls = "block text-xs font-medium text-foreground-muted mb-1";
const toolBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background-secondary disabled:opacity-40";

interface Placed {
  item: CatalogItem;
  rect: Rect;
  aspect: number;
  /** Degrees clockwise, around the item centre. */
  rotation: number;
}

type Draw = "multiply" | "tile" | "rounded" | "plain";

/** How a photo is drawn — mirrors the studio-background detection in lib/catalog/image.ts. */
function drawMode(bg: string | null): Draw {
  if (bg === "transparent") return "plain";
  if (bg === null) return "rounded";
  if (bg.toLowerCase() === "#ffffff") return "multiply";
  return "tile";
}

function tilePad(r: Rect) {
  return Math.max(r.w, r.h) * 0.05;
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string): Promise<HTMLImageElement> {
  let p = imageCache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Kunde inte ladda bilden."));
      img.src = src;
    });
    imageCache.set(src, p);
  }
  return p;
}

export function BuilderClient({
  items,
  publishAs,
  impersonating,
}: {
  items: CatalogItem[];
  publishAs: string | null;
  impersonating: boolean;
}) {
  // Local copy so a crop made here shows up in the picker immediately.
  const [catalog, setCatalog] = useState(items);
  const [cropId, setCropId] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [bg, setBg] = useState(BACKGROUNDS[0].hex);

  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [category, setCategory] = useState("Casual");
  const [gender, setGender] = useState<Gender>("herr");
  const [description, setDescription] = useState("");

  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<{ id: string; url: string; title: string } | null>(null);

  const suggested = useMemo(
    () => suggestTitle(placed.map((p) => ({ garment: p.item.garment, color: p.item.color }))),
    [placed],
  );
  const effectiveTitle = titleTouched ? title : suggested;

  const relayout = useCallback((list: Placed[], keepManual: boolean): Placed[] => {
    const rects = autoLayout(
      list.map((p) => ({ id: p.item.id, garment: p.item.garment, aspect: p.aspect })),
    );
    return list.map((p, i) => {
      // In manual mode only freshly added items (last in the list) move.
      if (keepManual && i < list.length - 1) return p;
      return { ...p, rect: rects.get(p.item.id) ?? p.rect };
    });
  }, []);

  const toggle = async (item: CatalogItem) => {
    setError(null);
    setPublished(null);
    if (placed.some((p) => p.item.id === item.id)) {
      const next = placed.filter((p) => p.item.id !== item.id);
      setPlaced(manual ? next : relayout(next, false));
      if (activeId === item.id) setActiveId(null);
      return;
    }
    let aspect = 0.75;
    try {
      const img = await loadImage(item.imageUrl);
      aspect = img.naturalWidth / img.naturalHeight || 0.75;
    } catch {
      setError(`Bilden för ”${item.name}” gick inte att ladda.`);
      return;
    }
    setPlaced((prev) => {
      if (prev.some((p) => p.item.id === item.id)) return prev;
      const next = [...prev, { item, aspect, rotation: 0, rect: { x: 0, y: 0, w: 0, h: 0 } }];
      return relayout(next, manual);
    });
    setActiveId(item.id);
  };

  const updateRect = (id: string, fn: (r: Rect, p: Placed) => Rect) => {
    setManual(true);
    setPlaced((prev) => prev.map((p) => (p.item.id === id ? { ...p, rect: fn(p.rect, p) } : p)));
  };

  const scaleActive = (factor: number) => {
    if (!activeId) return;
    updateRect(activeId, (r) => {
      const w = Math.min(CANVAS_W * 1.2, Math.max(80, r.w * factor));
      const h = (w / r.w) * r.h;
      return { x: r.x + (r.w - w) / 2, y: r.y + (r.h - h) / 2, w, h };
    });
  };

  const patchItem = (id: string, patch: Partial<Pick<Placed, "rect" | "rotation">>) => {
    setManual(true);
    setPlaced((prev) => prev.map((p) => (p.item.id === id ? { ...p, ...patch } : p)));
  };

  const rotateActive = (delta: number) => {
    if (!activeId) return;
    setManual(true);
    setPlaced((prev) =>
      prev.map((p) =>
        p.item.id === activeId
          ? { ...p, rotation: ((((p.rotation + delta) % 360) + 540) % 360) - 180 }
          : p,
      ),
    );
  };

  const reorderActive = (toFront: boolean) => {
    if (!activeId) return;
    setManual(true);
    setPlaced((prev) => {
      const p = prev.find((x) => x.item.id === activeId);
      if (!p) return prev;
      const rest = prev.filter((x) => x.item.id !== activeId);
      return toFront ? [...rest, p] : [p, ...rest];
    });
  };

  const removeActive = () => {
    const p = placed.find((x) => x.item.id === activeId);
    if (p) void toggle(p.item);
  };

  // Keyboard shortcuts while an item is active (ignored inside inputs).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (!activeId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeActive();
      } else if (e.key === "+" || e.key === "=") {
        scaleActive(1.08);
      } else if (e.key === "-") {
        scaleActive(1 / 1.08);
      } else if (e.key === "[" || e.key === "{") {
        rotateActive(e.key === "{" ? -1 : -15);
      } else if (e.key === "]" || e.key === "}") {
        rotateActive(e.key === "}" ? 1 : 15);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 40 : 10;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        updateRect(activeId, (r) => ({ ...r, x: r.x + dx, y: r.y + dy }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const reset = () => {
    setPlaced([]);
    setActiveId(null);
    setManual(false);
    setTitle("");
    setTitleTouched(false);
    setDescription("");
    setError(null);
  };

  const render = async (): Promise<File> => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas stöds inte i den här webbläsaren.");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (const p of placed) {
      const img = await loadImage(p.item.imageUrl);
      const { w, h } = p.rect;
      // Draw around the item centre so rotation matches the CSS transform.
      const x = -w / 2;
      const y = -h / 2;
      const mode = drawMode(p.item.imageBg);
      ctx.save();
      ctx.translate(p.rect.x + w / 2, p.rect.y + h / 2);
      ctx.rotate((p.rotation * Math.PI) / 180);
      if (mode === "tile") {
        const pad = tilePad(p.rect);
        ctx.fillStyle = p.item.imageBg!;
        ctx.beginPath();
        ctx.roundRect(x - pad, y - pad, w + pad * 2, h + pad * 2, RADIUS);
        ctx.fill();
        ctx.drawImage(img, x, y, w, h);
      } else if (mode === "rounded") {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, RADIUS);
        ctx.clip();
        ctx.drawImage(img, x, y, w, h);
      } else {
        if (mode === "multiply") ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(img, x, y, w, h);
      }
      ctx.restore();
    }

    const blob = await new Promise<Blob | null>((resolve, reject) => {
      try {
        canvas.toBlob(resolve, "image/jpeg", 0.9);
      } catch (e) {
        reject(e);
      }
    });
    if (!blob) throw new Error("Kunde inte skapa bilden.");
    return new File([blob], "flatlay.jpg", { type: "image/jpeg" });
  };

  const publish = async () => {
    if (placed.length === 0 || !effectiveTitle.trim()) return;
    setPublishing(true);
    setError(null);
    try {
      const image = await render();
      const clamp = (n: number) => Math.min(98, Math.max(2, Math.round(n * 100) / 100));
      const tags = placed.map((p) => ({
        brand: p.item.brand,
        name: p.item.name,
        buyUrl: p.item.buyUrl ?? "",
        garment: p.item.garment,
        price: p.item.price,
        currency: p.item.currency,
        color: p.item.color,
        material: p.item.material,
        imageUrl: p.item.imageUrl,
        x: clamp(((p.rect.x + p.rect.w / 2) / CANVAS_W) * 100),
        y: clamp(((p.rect.y + p.rect.h / 2) / CANVAS_H) * 100),
        isAffiliate: p.item.isAffiliate,
        catalogItemId: p.item.id,
      }));
      const fd = new FormData();
      fd.set("image", image);
      fd.set("title", effectiveTitle.trim());
      fd.set("description", description.trim());
      fd.set("category", category);
      fd.set("gender", gender);
      fd.set("vertical", "mode");
      fd.set("type", "flatlay");
      fd.set("keywords", "[]");
      fd.set("tags", JSON.stringify(tags));
      const res = await createOutfit({}, fd);
      if (res.error || !res.success) throw new Error(res.error ?? "Okänt fel.");
      setPublished({ id: res.success.id, url: res.success.url, title: res.success.title });
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte publicera.");
    } finally {
      setPublishing(false);
    }
  };

  const selectedIds = new Set(placed.map((p) => p.item.id));
  const active = placed.find((p) => p.item.id === activeId) ?? null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
      <Picker items={catalog} selected={selectedIds} onToggle={toggle} />

      <div className="space-y-4 lg:sticky lg:top-24 self-start">
        {published && (
          <div className="rounded-xl border border-border bg-background-secondary p-4 text-sm">
            <p className="text-foreground font-medium">”{published.title}” är publicerad.</p>
            <div className="mt-2 flex gap-4">
              <Link href={published.url} className="underline underline-offset-2" target="_blank">
                Visa outfit
              </Link>
              <Link href={`/admin/inlagg/${published.id}`} className="underline underline-offset-2" target="_blank">
                Redigera
              </Link>
            </div>
          </div>
        )}

        {cropId && (() => {
          const target = placed.find((p) => p.item.id === cropId);
          if (!target) return null;
          return (
            <CropDialog
              src={target.item.imageUrl}
              title={target.item.name}
              onCancel={() => setCropId(null)}
              onCropped={async (file) => {
                const fd = new FormData();
                fd.set("image", file);
                const res = await replaceCatalogImage(target.item.id, fd);
                if (!res.ok) throw new Error(res.error);
                const img = await loadImage(res.item.imageUrl);
                const aspect = img.naturalWidth / img.naturalHeight || target.aspect;
                // Keep the garment's centre and width; height follows the new crop.
                setPlaced((prev) =>
                  prev.map((p) => {
                    if (p.item.id !== target.item.id) return p;
                    const cx = p.rect.x + p.rect.w / 2;
                    const cy = p.rect.y + p.rect.h / 2;
                    const w = p.rect.w;
                    const h = w / aspect;
                    return { ...p, item: { ...p.item, ...res.item }, aspect, rect: { x: cx - w / 2, y: cy - h / 2, w, h } };
                  }),
                );
                setCatalog((prev) => prev.map((c) => (c.id === res.item.id ? { ...c, ...res.item, usage: c.usage } : c)));
                setCropId(null);
              }}
            />
          );
        })()}

        <Stage
          placed={placed}
          bg={bg}
          activeId={activeId}
          onActivate={setActiveId}
          onChange={patchItem}
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" className={toolBtn} disabled={!active} onClick={() => scaleActive(1 / 1.1)} aria-label="Mindre">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button type="button" className={toolBtn} disabled={!active} onClick={() => scaleActive(1.1)} aria-label="Större">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button type="button" className={toolBtn} disabled={!active} onClick={() => rotateActive(-15)} aria-label="Rotera 15° moturs">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button type="button" className={toolBtn} disabled={!active} onClick={() => rotateActive(15)} aria-label="Rotera 15° medurs">
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          {active && active.rotation !== 0 && (
            <button
              type="button"
              className={toolBtn}
              onClick={() => patchItem(active.item.id, { rotation: 0 })}
              title="Nollställ rotation"
            >
              {Math.round(active.rotation)}° ×
            </button>
          )}
          <button type="button" className={toolBtn} disabled={!active} onClick={() => active && setCropId(active.item.id)}>
            <Crop className="h-3.5 w-3.5" /> Beskär
          </button>
          <button type="button" className={toolBtn} disabled={!active} onClick={() => reorderActive(true)}>
            <ArrowUpToLine className="h-3.5 w-3.5" /> Fram
          </button>
          <button type="button" className={toolBtn} disabled={!active} onClick={() => reorderActive(false)}>
            <ArrowDownToLine className="h-3.5 w-3.5" /> Bak
          </button>
          <button type="button" className={toolBtn} disabled={!active} onClick={removeActive}>
            <Trash2 className="h-3.5 w-3.5" /> Ta bort
          </button>
          <button
            type="button"
            className={toolBtn}
            disabled={placed.length === 0}
            onClick={() => {
              setManual(false);
              setPlaced((prev) => relayout(prev, false));
            }}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Ordna automatiskt
          </button>
          <div className="ml-auto flex items-center gap-1" role="radiogroup" aria-label="Bakgrund">
            {BACKGROUNDS.map((b) => (
              <button
                key={b.hex}
                type="button"
                role="radio"
                aria-checked={bg === b.hex}
                title={b.name}
                aria-label={b.name}
                onClick={() => setBg(b.hex)}
                className={`h-6 w-6 rounded-full border ${
                  bg === b.hex ? "border-foreground ring-2 ring-foreground/30" : "border-border"
                }`}
                style={{ backgroundColor: b.hex }}
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-foreground-subtle">
          Dra för att flytta, dra i hörnet för att ändra storlek och i den runda pricken ovanför för att
          rotera (Shift = steg om 15°). Tangenter: piltangenter flyttar, + / − ändrar storlek,
          [ / ] roterar 15° (Shift: 1°), Delete tar bort.
        </p>

        <div className="rounded-2xl border border-border bg-background-secondary p-4 space-y-3">
          <div>
            <label className={labelCls} htmlFor="flatlay-title">Titel</label>
            <input
              id="flatlay-title"
              className={inputCls}
              value={effectiveTitle}
              placeholder="Väljs automatiskt från färgerna"
              onChange={(e) => {
                setTitleTouched(true);
                setTitle(e.target.value);
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls} htmlFor="flatlay-category">Stil</label>
              <select id="flatlay-category" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="flatlay-gender">Kön</label>
              <select id="flatlay-gender" className={inputCls} value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                <option value="herr">Herr</option>
                <option value="dam">Dam</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="flatlay-desc">Beskrivning (valfri)</label>
            <textarea
              id="flatlay-desc"
              rows={2}
              className={inputCls}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="button"
            onClick={publish}
            disabled={publishing || placed.length === 0 || !effectiveTitle.trim()}
            className="w-full inline-flex items-center justify-center rounded-full bg-foreground text-background px-5 py-3 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50"
          >
            {publishing
              ? "Publicerar…"
              : placed.length === 0
                ? "Välj plagg till vänster"
                : `Publicera outfit (${placed.length} plagg)`}
          </button>
          {publishAs && (
            <p className={`text-xs ${impersonating ? "text-amber-600" : "text-foreground-subtle"}`}>
              Publiceras som @{publishAs}
              {impersonating ? " (du agerar som den här användaren)" : ""}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stage: DOM preview drawn with the same geometry as the export       */
/* ------------------------------------------------------------------ */

type ItemPatch = Partial<Pick<Placed, "rect" | "rotation">>;

type DragState =
  | { kind: "move"; id: string; x: number; y: number }
  | { kind: "resize"; id: string; cx: number; cy: number; d0: number; r0: Rect }
  | { kind: "rotate"; id: string; cx: number; cy: number; a0: number; rot0: number };

/** Normalise to [-180, 180) and snap to the nearest right angle within 4°. */
function snapAngle(deg: number): number {
  const norm = (((deg % 360) + 540) % 360) - 180;
  const nearest = Math.round(norm / 90) * 90;
  if (Math.abs(norm - nearest) > 4) return norm;
  return nearest === 180 ? -180 : nearest;
}

function Stage({
  placed,
  bg,
  activeId,
  onActivate,
  onChange,
}: {
  placed: Placed[];
  bg: string;
  activeId: string | null;
  onActivate: (id: string | null) => void;
  onChange: (id: string, patch: ItemPatch) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);
  const drag = useRef<DragState | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / CANVAS_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Item centre in client (screen) coordinates. */
  const centreOf = (r: Rect) => {
    const box = ref.current!.getBoundingClientRect();
    return {
      cx: box.left + (r.x + r.w / 2) * scale,
      cy: box.top + (r.y + r.h / 2) * scale,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = placed.find((x) => x.item.id === d.id);
    if (!p) return;
    if (d.kind === "move") {
      const dx = (e.clientX - d.x) / scale;
      const dy = (e.clientY - d.y) / scale;
      d.x = e.clientX;
      d.y = e.clientY;
      onChange(d.id, { rect: { ...p.rect, x: p.rect.x + dx, y: p.rect.y + dy } });
    } else if (d.kind === "resize") {
      // Scale by distance from the centre, so it behaves the same at any rotation.
      const dist = Math.hypot(e.clientX - d.cx, e.clientY - d.cy);
      const w = Math.min(CANVAS_W * 1.2, Math.max(80, d.r0.w * (dist / d.d0)));
      const h = (w / d.r0.w) * d.r0.h;
      const cx = d.r0.x + d.r0.w / 2;
      const cy = d.r0.y + d.r0.h / 2;
      onChange(d.id, { rect: { x: cx - w / 2, y: cy - h / 2, w, h } });
    } else {
      const a = (Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180) / Math.PI;
      const raw = d.rot0 + (a - d.a0);
      onChange(d.id, {
        rotation: e.shiftKey ? snapAngle(Math.round(raw / 15) * 15) : snapAngle(raw),
      });
    }
  };

  const start = (e: React.PointerEvent, p: Placed, kind: DragState["kind"]) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const { cx, cy } = centreOf(p.rect);
    if (kind === "move") {
      drag.current = { kind, id: p.item.id, x: e.clientX, y: e.clientY };
    } else if (kind === "resize") {
      drag.current = {
        kind,
        id: p.item.id,
        cx,
        cy,
        d0: Math.max(1, Math.hypot(e.clientX - cx, e.clientY - cy)),
        r0: p.rect,
      };
    } else {
      drag.current = {
        kind,
        id: p.item.id,
        cx,
        cy,
        a0: (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI,
        rot0: p.rotation,
      };
    }
    onActivate(p.item.id);
  };

  const px = (n: number) => `${n * scale}px`;
  const end = () => {
    drag.current = null;
  };

  return (
    <div
      ref={ref}
      className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-border select-none touch-none"
      style={{ backgroundColor: bg, isolation: "isolate" }}
      onPointerDown={() => onActivate(null)}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {placed.length === 0 && (
        <p className="absolute inset-0 grid place-items-center text-sm text-foreground-subtle text-center px-8">
          Klicka på plagg i listan för att börja.
        </p>
      )}
      {placed.map((p) => {
        const mode = drawMode(p.item.imageBg);
        const pad = tilePad(p.rect);
        const isActive = p.item.id === activeId;
        return (
          <div
            key={p.item.id}
            role="button"
            tabIndex={0}
            aria-label={`${p.item.brand} ${p.item.name}`}
            onPointerDown={(e) => start(e, p, "move")}
            className={`absolute cursor-grab active:cursor-grabbing ${
              isActive ? "outline outline-2 outline-offset-2 outline-foreground/60" : ""
            }`}
            style={{
              left: px(p.rect.x),
              top: px(p.rect.y),
              width: px(p.rect.w),
              height: px(p.rect.h),
              transform: p.rotation ? `rotate(${p.rotation}deg)` : undefined,
              // Blend on the transformed element itself: a transform creates
              // its own stacking context, so a blended child would only see
              // its (empty) parent instead of the canvas.
              mixBlendMode: mode === "multiply" ? "multiply" : "normal",
            }}
          >
            {mode === "tile" && (
              <div
                className="absolute pointer-events-none"
                style={{
                  inset: px(-pad),
                  backgroundColor: p.item.imageBg!,
                  borderRadius: px(RADIUS),
                }}
              />
            )}
            <div
              className="absolute inset-0"
              style={{
                borderRadius: mode === "rounded" ? px(RADIUS) : undefined,
                overflow: mode === "rounded" ? "hidden" : undefined,
              }}
            >
              <img src={p.item.imageUrl} alt="" draggable={false} crossOrigin="anonymous" className="h-full w-full" />
            </div>
            {isActive && (
              <>
                <span
                  onPointerDown={(e) => start(e, p, "resize")}
                  title="Dra för att ändra storlek"
                  className="absolute -right-2 -bottom-2 h-4 w-4 rounded-full bg-foreground border-2 border-background cursor-nwse-resize"
                  aria-hidden
                />
                <span
                  className="absolute left-1/2 -top-6 h-6 w-px bg-foreground/60 pointer-events-none"
                  aria-hidden
                />
                <span
                  onPointerDown={(e) => start(e, p, "rotate")}
                  title="Dra för att rotera (Shift = steg om 15°)"
                  className="absolute left-1/2 -top-11 -ml-2.5 h-5 w-5 rounded-full bg-background border-2 border-foreground cursor-grab grid place-items-center text-foreground"
                  aria-hidden
                >
                  <RotateCw className="h-2.5 w-2.5" />
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Picker                                                              */
/* ------------------------------------------------------------------ */

function Picker({
  items,
  selected,
  onToggle,
}: {
  items: CatalogItem[];
  selected: Set<string>;
  onToggle: (item: CatalogItem) => void;
}) {
  const [q, setQ] = useState("");
  const [garment, setGarment] = useState("");
  const [gender, setGender] = useState<"herr" | "dam" | "">("herr");

  const pool = useMemo(
    () => items.filter((i) => !gender || i.gender === null || i.gender === gender),
    [items, gender],
  );
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of pool) m.set(i.garment, (m.get(i.garment) ?? 0) + 1);
    return m;
  }, [pool]);
  const garments = GARMENT_ORDER.filter((g) => counts.has(g)).concat(
    [...counts.keys()].filter((g) => !GARMENT_ORDER.includes(g)),
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return pool.filter(
      (i) =>
        (!garment || i.garment === garment) &&
        (!needle || `${i.brand} ${i.name} ${i.color ?? ""} ${i.garment}`.toLowerCase().includes(needle)),
    );
  }, [pool, q, garment]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-background-secondary p-8 text-center">
        <p className="text-sm text-foreground-muted">Plaggbanken är tom.</p>
        <Link href="/admin/plagg" className="mt-3 inline-block text-sm underline underline-offset-2">
          Lägg till plagg
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
          <input className={`${inputCls} pl-9`} placeholder="Sök märke, namn, färg…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${inputCls} w-auto`} value={gender} onChange={(e) => setGender(e.target.value as "herr" | "dam" | "")}>
          <option value="herr">Herr</option>
          <option value="dam">Dam</option>
          <option value="">Alla</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip active={garment === ""} onClick={() => setGarment("")}>
          Alla <span className="opacity-60">{pool.length}</span>
        </Chip>
        {garments.map((g) => (
          <Chip key={g} active={garment === g} onClick={() => setGarment(garment === g ? "" : g)}>
            {g} <span className="opacity-60">{counts.get(g)}</span>
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-2.5">
        {filtered.map((i) => {
          const on = selected.has(i.id);
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => onToggle(i)}
              aria-pressed={on}
              className="text-left group relative"
            >
              <CatalogThumb
                src={i.imageUrl}
                bg={i.imageBg}
                alt={i.name}
                className={`aspect-[3/4] rounded-lg border-2 transition-colors ${
                  on ? "border-foreground" : "border-transparent group-hover:border-foreground/30"
                }`}
              />
              {on && (
                <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-foreground text-background grid place-items-center">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <p className="mt-1 text-[10px] uppercase tracking-wide text-foreground-subtle truncate">{i.brand}</p>
              <p className="text-xs text-foreground truncate">{i.name}</p>
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-foreground-muted text-center py-8">Inga plagg matchar.</p>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-foreground text-background border-foreground"
          : "border-border text-foreground hover:bg-background-secondary"
      }`}
    >
      {children}
    </button>
  );
}
