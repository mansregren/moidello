/**
 * Auto-layout for the flatlay builder. Works in a virtual 1200×1600 (3:4)
 * canvas — the same space the publish step renders at — and returns one
 * rect per item that hugs the photo's aspect ratio.
 *
 * Main garments stack top-to-bottom in body order in the left column;
 * outerwear and accessories go in a narrower right column. With nothing
 * for the right column, the stack is centred.
 */

export const CANVAS_W = 1200;
export const CANVAS_H = 1600;
const MARGIN = 70;
const GAP = 44;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutInput {
  id: string;
  garment: string;
  /** width / height of the photo */
  aspect: number;
}

type Slot = "outer" | "top" | "dress" | "bottom" | "shoes" | "bag" | "acc";

const SLOT_OF: Record<string, Slot> = {
  Outerwear: "outer",
  Blazer: "outer",
  Suit: "outer",
  "T-shirt": "top",
  "Tank top": "top",
  Tops: "top",
  Shirt: "top",
  Blouse: "top",
  Polo: "top",
  Sweater: "top",
  Knitwear: "top",
  Hoodie: "top",
  Dresses: "dress",
  Jeans: "bottom",
  Trousers: "bottom",
  Chinos: "bottom",
  Shorts: "bottom",
  Skirt: "bottom",
  Shoes: "shoes",
  Bags: "bag",
};

export function slotOf(garment: string): Slot {
  return SLOT_OF[garment] ?? "acc";
}

const ORDER: Slot[] = ["outer", "top", "dress", "bottom", "shoes", "bag", "acc"];
const WEIGHT: Record<Slot, number> = {
  outer: 1.1,
  top: 1,
  dress: 1.7,
  bottom: 1.2,
  shoes: 0.55,
  bag: 0.7,
  acc: 0.45,
};

/** Body order: outer → top → dress → bottom → shoes → bag → accessories. */
export function bodyOrder<T extends { garment: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => ORDER.indexOf(slotOf(a.garment)) - ORDER.indexOf(slotOf(b.garment)),
  );
}

function fitInto(aspect: number, cell: Rect, scale = 0.94): Rect {
  const a = aspect > 0 && Number.isFinite(aspect) ? aspect : 0.75;
  let w = cell.w * scale;
  let h = w / a;
  if (h > cell.h * scale) {
    h = cell.h * scale;
    w = h * a;
  }
  return { x: cell.x + (cell.w - w) / 2, y: cell.y + (cell.h - h) / 2, w, h };
}

function stack(items: LayoutInput[], x: number, width: number): Map<string, Rect> {
  const out = new Map<string, Rect>();
  if (items.length === 0) return out;
  const available = CANVAS_H - 2 * MARGIN - GAP * (items.length - 1);
  const total = items.reduce((s, i) => s + WEIGHT[slotOf(i.garment)], 0);
  let y = MARGIN;
  for (const item of items) {
    const h = (available * WEIGHT[slotOf(item.garment)]) / total;
    // Small things (shoes, accessories) shouldn't stretch to the full
    // column width — cap their width relative to their row height.
    const cell = { x, y, w: width, h };
    out.set(item.id, fitInto(item.aspect, cell));
    y += h + GAP;
  }
  return out;
}

export function autoLayout(items: LayoutInput[]): Map<string, Rect> {
  const ordered = bodyOrder(items);
  let main = ordered.filter((i) => !["outer", "bag", "acc"].includes(slotOf(i.garment)));
  let side = ordered.filter((i) => ["outer", "bag", "acc"].includes(slotOf(i.garment)));

  // Everything is "side" material (e.g. jacket + bag) → one column.
  if (main.length === 0) {
    main = side;
    side = [];
  }
  // A lone accessory doesn't justify a column; neither does a long side
  // list next to a single garment — rebalance into the main stack.
  if (side.length > 0 && main.length + side.length <= 2) {
    main = bodyOrder([...main, ...side]);
    side = [];
  }

  if (side.length === 0) {
    const width = Math.min(CANVAS_W - 2 * MARGIN, 820);
    return stack(main, (CANVAS_W - width) / 2, width);
  }

  const inner = CANVAS_W - 2 * MARGIN - GAP;
  const mainW = inner * 0.58;
  const sideW = inner - mainW;
  const rects = stack(main, MARGIN, mainW);
  for (const [id, r] of stack(side, MARGIN + mainW + GAP, sideW)) rects.set(id, r);
  return rects;
}

const COLORLESS_TITLE: Record<string, string> = {
  Outerwear: "Jacket",
  Knitwear: "Knit",
  Tops: "Top",
  Dresses: "Dress",
  Bags: "Bag",
};

/** "Navy, White & Beige" — matches the colour-led titles used elsewhere. */
export function suggestTitle(items: Array<{ garment: string; color: string | null }>): string {
  const main = bodyOrder(items).filter((i) => !["acc", "bag"].includes(slotOf(i.garment)));
  const words: string[] = [];
  for (const i of main.length > 0 ? main : items) {
    const w = i.color || COLORLESS_TITLE[i.garment] || i.garment;
    if (!words.includes(w)) words.push(w);
    if (words.length === 3) break;
  }
  if (words.length <= 1) return words[0] ? `All ${words[0]}` : "";
  return `${words.slice(0, -1).join(", ")} & ${words[words.length - 1]}`;
}

/** What a flatlay outfit stores in outfits.builder_layout so the builder can reopen it. */
export interface BuilderLayout {
  version: 1;
  bg: string;
  items: Array<{ catalogItemId: string; rect: Rect; rotation: number }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validate untrusted layout JSON; returns null when it doesn't fit the shape. */
export function parseBuilderLayout(raw: unknown): BuilderLayout | null {
  let v = raw;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return null;
    }
  }
  if (!v || typeof v !== "object") return null;
  const o = v as { version?: unknown; bg?: unknown; items?: unknown };
  if (o.version !== 1 || typeof o.bg !== "string" || !/^#[0-9a-f]{6}$/i.test(o.bg)) return null;
  if (!Array.isArray(o.items) || o.items.length === 0 || o.items.length > 40) return null;
  const num = (n: unknown, lo: number, hi: number) =>
    typeof n === "number" && Number.isFinite(n) && n >= lo && n <= hi;
  const items: BuilderLayout["items"] = [];
  for (const it of o.items as Array<Record<string, unknown>>) {
    const r = it?.rect as Record<string, unknown> | undefined;
    if (
      typeof it?.catalogItemId !== "string" ||
      !UUID_RE.test(it.catalogItemId) ||
      !r ||
      !num(r.x, -CANVAS_W, CANVAS_W * 2) ||
      !num(r.y, -CANVAS_H, CANVAS_H * 2) ||
      !num(r.w, 1, CANVAS_W * 2) ||
      !num(r.h, 1, CANVAS_H * 2) ||
      !num(it.rotation, -360, 360)
    ) {
      return null;
    }
    items.push({
      catalogItemId: it.catalogItemId,
      rect: { x: r.x as number, y: r.y as number, w: r.w as number, h: r.h as number },
      rotation: it.rotation as number,
    });
  }
  return { version: 1, bg: o.bg.toUpperCase(), items };
}
