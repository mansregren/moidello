"use client";

/* eslint-disable @next/next/no-img-element -- remote preview images */

import { useMemo, useState } from "react";
import { Link2, Upload, Download, Search, X, ExternalLink, Crop, Eraser } from "lucide-react";
import {
  createCatalogItemFromUpload,
  deleteCatalogItem,
  importTaggedItemsBatch,
  previewCatalogUrls,
  replaceCatalogImage,
  saveCatalogDraft,
  setCatalogArchived,
  updateCatalogItem,
} from "@/app/actions/catalog";
import { CatalogThumb } from "@/components/admin/CatalogThumb";
import { CropDialog } from "@/components/admin/CropDialog";
import { BgRemoveDialog } from "@/components/admin/BgRemoveDialog";
import { ColorPicker } from "@/components/shared/ColorPicker";
import { GARMENTS, GARMENTS_HERR, type Gender } from "@/lib/garments";
import { GARMENT_COLORS } from "@/lib/colors";
import type { CatalogDraft, CatalogItem } from "@/lib/catalog/types";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-foreground/20";
const labelCls = "block text-xs font-medium text-foreground-muted mb-1";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50";
const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary disabled:opacity-50";

// Herr garments first (the public site is Herr-only), then the rest.
const GARMENT_OPTIONS = Array.from(new Set<string>([...GARMENTS_HERR, ...GARMENTS]));

type Panel = "links" | "upload" | "import" | null;

export function PlaggClient({
  initialItems,
  unlinkedTagCount,
}: {
  initialItems: CatalogItem[];
  unlinkedTagCount: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [panel, setPanel] = useState<Panel>(initialItems.length === 0 ? "links" : null);
  const [editing, setEditing] = useState<CatalogItem | null>(null);

  const upsert = (item: CatalogItem) =>
    setItems((prev) => {
      const i = prev.findIndex((p) => p.id === item.id);
      if (i === -1) return [item, ...prev];
      const next = [...prev];
      next[i] = { ...item, usage: prev[i].usage };
      return next;
    });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <PanelButton active={panel === "links"} onClick={() => setPanel(panel === "links" ? null : "links")}>
          <Link2 className="h-4 w-4" /> Lägg till via länkar
        </PanelButton>
        <PanelButton active={panel === "upload"} onClick={() => setPanel(panel === "upload" ? null : "upload")}>
          <Upload className="h-4 w-4" /> Ladda upp manuellt
        </PanelButton>
        <PanelButton active={panel === "import"} onClick={() => setPanel(panel === "import" ? null : "import")}>
          <Download className="h-4 w-4" /> Importera från befintliga outfits
        </PanelButton>
      </div>

      {panel === "links" && <AddFromLinks onSaved={upsert} />}
      {panel === "upload" && <ManualUpload onSaved={upsert} />}
      {panel === "import" && (
        <ImportFromOutfits
          initialPending={unlinkedTagCount}
          onDone={() => window.location.reload()}
        />
      )}

      <CatalogGrid items={items} onOpen={setEditing} />

      {editing && (
        <EditDialog
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(item) => {
            upsert(item);
            setEditing({ ...item, usage: editing.usage });
          }}
          onArchived={(archived) => {
            setItems((prev) =>
              prev.map((p) => (p.id === editing.id ? { ...p, isArchived: archived } : p)),
            );
            setEditing(null);
          }}
          onDeleted={() => {
            setItems((prev) => prev.filter((p) => p.id !== editing.id));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function PanelButton({
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
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
        active
          ? "bg-foreground text-background border-foreground"
          : "border-border text-foreground hover:bg-background-secondary"
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Add from links                                                      */
/* ------------------------------------------------------------------ */

/** Parse a pasted JSON array of prepared drafts; null if it isn't one. */
function parsePreparedDrafts(
  text: string,
  gender: Gender | null,
): CatalogDraft[] | null {
  const t = text.trim();
  if (!t.startsWith("[")) return null;
  try {
    const arr = JSON.parse(t) as Array<Partial<CatalogDraft>>;
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr
      .filter((d) => d && typeof d.url === "string" && typeof d.sourceImageUrl === "string")
      .map((d) => ({
        url: String(d.url),
        brand: String(d.brand ?? ""),
        name: String(d.name ?? ""),
        garment: String(d.garment ?? ""),
        gender: d.gender === undefined ? gender : d.gender,
        color: String(d.color ?? ""),
        material: String(d.material ?? ""),
        price: typeof d.price === "number" ? d.price : null,
        currency: String(d.currency ?? "SEK"),
        sourceImageUrl: String(d.sourceImageUrl),
        retailer: d.retailer ?? null,
        retailerLocale: d.retailerLocale ?? null,
        isAffiliate: !!d.isAffiliate,
        affiliateNetwork: d.affiliateNetwork ?? null,
        duplicateOf: null,
        warning: null,
      }));
  } catch {
    return null;
  }
}

type DraftState = CatalogDraft & { key: string; status: "idle" | "saving" | "error"; error?: string };

function AddFromLinks({ onSaved }: { onSaved: (item: CatalogItem) => void }) {
  const [text, setText] = useState("");
  const [gender, setGender] = useState<Gender | "">("herr");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftState[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // A pasted JSON array of prepared drafts (e.g. a curated list with a
  // chosen packshot per product) skips the fetch step and lands straight
  // in the review list.
  const jsonDrafts = parsePreparedDrafts(text, gender || null);
  const urls = jsonDrafts
    ? []
    : text
        .split(/[\s,]+/)
        .map((u) => u.trim())
        .filter((u) => /^https?:\/\//i.test(u));

  const addPrepared = () => {
    if (!jsonDrafts) return;
    setDrafts((prev) => [
      ...prev,
      ...jsonDrafts.map((d) => ({
        ...d,
        key: `${d.url}-${Math.random()}`,
        status: "idle" as const,
      })),
    ]);
    setText("");
  };

  const fetchDrafts = async () => {
    setError(null);
    setLoading(true);
    try {
      // The action caps each call at 25 URLs — chunk bigger pastes.
      const collected: DraftState[] = [];
      for (let i = 0; i < urls.length; i += 25) {
        const res = await previewCatalogUrls(urls.slice(i, i + 25), gender || null);
        if (!res.ok) throw new Error(res.error);
        collected.push(
          ...res.drafts.map((d) => ({
            ...d,
            key: `${d.url}-${Math.random()}`,
            status: "idle" as const,
          })),
        );
        setDrafts((prev) => [...prev, ...collected.splice(0)]);
      }
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel.");
    } finally {
      setLoading(false);
    }
  };

  const patch = (key: string, p: Partial<DraftState>) =>
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...p } : d)));

  const saveAll = async () => {
    setSaving(true);
    let saved = 0;
    for (const d of drafts) {
      if (d.duplicateOf) continue;
      patch(d.key, { status: "saving", error: undefined });
      const res = await saveCatalogDraft(d);
      if (res.ok) {
        saved++;
        setSavedCount((c) => c + 1);
        onSaved({ ...res.item, usage: 0 });
        setDrafts((prev) => prev.filter((x) => x.key !== d.key));
      } else {
        patch(d.key, { status: "error", error: res.error });
      }
    }
    setSaving(false);
    return saved;
  };

  const savable = drafts.filter((d) => !d.duplicateOf);
  const incomplete = savable.filter(
    (d) => !d.brand.trim() || !d.name.trim() || !d.garment || !d.sourceImageUrl.trim(),
  );

  return (
    <section className="rounded-2xl border border-border bg-background-secondary p-5 space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <label className={labelCls} htmlFor="catalog-urls">
            Produktlänkar (en per rad, max 100 åt gången)
          </label>
          <textarea
            id="catalog-urls"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"https://www.butik.se/produkt/...\nhttps://www.annanbutik.com/..."}
            className={`${inputCls} font-mono text-xs`}
          />
        </div>
        <div className="flex flex-col gap-2 md:w-48">
          <label className={labelCls} htmlFor="catalog-default-gender">
            Kön för nya plagg
          </label>
          <select
            id="catalog-default-gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender | "")}
            className={inputCls}
          >
            <option value="herr">Herr</option>
            <option value="dam">Dam</option>
            <option value="">Unisex</option>
          </select>
          {jsonDrafts ? (
            <button type="button" onClick={addPrepared} className={primaryBtn}>
              {`Lägg till ${jsonDrafts.length} förberedda plagg`}
            </button>
          ) : (
            <button
              type="button"
              onClick={fetchDrafts}
              disabled={loading || urls.length === 0 || urls.length > 100}
              className={primaryBtn}
            >
              {loading ? "Hämtar…" : `Hämta ${urls.length || ""} plagg`}
            </button>
          )}
        </div>
      </div>
      {urls.length > 100 && (
        <p className="text-sm text-red-500">Max 100 länkar åt gången.</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {savedCount > 0 && drafts.length === 0 && (
        <p className="text-sm text-foreground">
          {savedCount} plagg sparade i plaggbanken.
        </p>
      )}

      {drafts.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground-muted">
              Kontrollera och rätta innan du sparar.
              {incomplete.length > 0 && (
                <span className="text-amber-600">
                  {" "}
                  {incomplete.length} saknar märke, namn, typ eller bild.
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <button type="button" className={secondaryBtn} onClick={() => setDrafts([])} disabled={saving}>
                Rensa
              </button>
              <button
                type="button"
                className={primaryBtn}
                onClick={saveAll}
                disabled={saving || savable.length === 0}
              >
                {saving ? "Sparar…" : `Spara ${savable.length} plagg`}
              </button>
            </div>
          </div>
          {drafts.map((d) => (
            <DraftCard
              key={d.key}
              draft={d}
              onChange={(p) => patch(d.key, p)}
              onRemove={() => setDrafts((prev) => prev.filter((x) => x.key !== d.key))}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function DraftCard({
  draft: d,
  onChange,
  onRemove,
}: {
  draft: DraftState;
  onChange: (p: Partial<DraftState>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`rounded-xl border bg-background p-3 grid gap-3 sm:grid-cols-[112px_1fr] ${
        d.status === "error" ? "border-red-400" : d.duplicateOf ? "border-amber-400" : "border-border"
      } ${d.status === "saving" ? "opacity-60" : ""}`}
    >
      <div className="aspect-[3/4] w-28 rounded-lg bg-white overflow-hidden border border-border">
        {d.sourceImageUrl ? (
          <img src={d.sourceImageUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <div className="h-full w-full grid place-items-center text-xs text-foreground-subtle text-center p-2">
            Ingen bild
          </div>
        )}
      </div>
      <div className="space-y-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <a
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-foreground-subtle truncate hover:underline"
          >
            {d.url}
          </a>
          <button type="button" onClick={onRemove} aria-label="Ta bort" className="text-foreground-subtle hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {d.duplicateOf && (
          <p className="text-xs text-amber-600">
            Finns redan i plaggbanken som ”{d.duplicateOf.name}”. Hoppas över.
          </p>
        )}
        {d.warning && <p className="text-xs text-amber-600">{d.warning}</p>}
        {d.error && <p className="text-xs text-red-500">{d.error}</p>}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input className={inputCls} placeholder="Märke" value={d.brand} onChange={(e) => onChange({ brand: e.target.value })} />
          <input className={`${inputCls} lg:col-span-2`} placeholder="Namn" value={d.name} onChange={(e) => onChange({ name: e.target.value })} />
          <select className={inputCls} value={d.garment} onChange={(e) => onChange({ garment: e.target.value })}>
            <option value="">Typ…</option>
            {GARMENT_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              className={inputCls}
              placeholder="Pris"
              inputMode="decimal"
              value={d.price ?? ""}
              onChange={(e) => {
                const n = Number(e.target.value.replace(",", "."));
                onChange({ price: e.target.value === "" || !Number.isFinite(n) ? null : n });
              }}
            />
            <input className={`${inputCls} w-20`} value={d.currency} onChange={(e) => onChange({ currency: e.target.value.toUpperCase() })} />
          </div>
          <select
            className={inputCls}
            value={d.gender ?? ""}
            onChange={(e) => onChange({ gender: (e.target.value || null) as Gender | null })}
          >
            <option value="herr">Herr</option>
            <option value="dam">Dam</option>
            <option value="">Unisex</option>
          </select>
          <input
            className={`${inputCls} lg:col-span-2`}
            placeholder="Bildlänk"
            value={d.sourceImageUrl}
            onChange={(e) => onChange({ sourceImageUrl: e.target.value })}
          />
        </div>
        <ColorPicker value={d.color} onChange={(color) => onChange({ color })} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Manual upload                                                       */
/* ------------------------------------------------------------------ */

/** Downscale big uploads in the browser (keeps transparency via WebP). */
async function shrinkForUpload(file: File): Promise<File> {
  if (file.size <= 3.5 * 1024 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.9));
  return blob ? new File([blob], "upload.webp", { type: "image/webp" }) : file;
}

function ManualUpload({ onSaved }: { onSaved: (item: CatalogItem) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fields, setFields] = useState({
    brand: "",
    name: "",
    garment: "",
    gender: "herr",
    color: "",
    price: "",
    currency: "SEK",
    buyUrl: "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof typeof fields, v: string) => setFields((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.set("image", await shrinkForUpload(file));
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    const res = await createCatalogItemFromUpload(fd);
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    onSaved({ ...res.item, usage: 0 });
    setMsg({ ok: true, text: `”${res.item.name}” sparad.` });
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFields((f) => ({ ...f, name: "", price: "", buyUrl: "", color: "" }));
  };

  return (
    <section className="rounded-2xl border border-border bg-background-secondary p-5 grid gap-5 md:grid-cols-[180px_1fr]">
      <label className="aspect-[3/4] rounded-xl border border-dashed border-border bg-white grid place-items-center cursor-pointer overflow-hidden">
        {preview ? (
          <img src={preview} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-foreground-subtle text-center px-3">
            Välj bild
            <br />
            (helst på vit eller transparent bakgrund)
          </span>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            if (preview) URL.revokeObjectURL(preview);
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
      </label>
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelCls}>Märke</label>
            <input className={inputCls} value={fields.brand} onChange={(e) => set("brand", e.target.value)} />
          </div>
          <div className="lg:col-span-2">
            <label className={labelCls}>Namn</label>
            <input className={inputCls} value={fields.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Typ</label>
            <select className={inputCls} value={fields.garment} onChange={(e) => set("garment", e.target.value)}>
              <option value="">Välj…</option>
              {GARMENT_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Kön</label>
            <select className={inputCls} value={fields.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="herr">Herr</option>
              <option value="dam">Dam</option>
              <option value="">Unisex</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={labelCls}>Pris</label>
              <input className={inputCls} inputMode="decimal" value={fields.price} onChange={(e) => set("price", e.target.value)} />
            </div>
            <div className="w-20">
              <label className={labelCls}>Valuta</label>
              <input className={inputCls} value={fields.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={labelCls}>Köplänk</label>
            <input className={inputCls} placeholder="https://" value={fields.buyUrl} onChange={(e) => set("buyUrl", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Färg</label>
          <ColorPicker value={fields.color} onChange={(c) => set("color", c)} />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={primaryBtn}
            onClick={submit}
            disabled={busy || !file || !fields.brand.trim() || !fields.name.trim() || !fields.garment}
          >
            {busy ? "Sparar…" : "Spara plagg"}
          </button>
          {msg && (
            <p className={`text-sm ${msg.ok ? "text-foreground" : "text-red-500"}`}>{msg.text}</p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Import from existing outfits                                        */
/* ------------------------------------------------------------------ */

function ImportFromOutfits({
  initialPending,
  onDone,
}: {
  initialPending: number;
  onDone: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [imported, setImported] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [failed, setFailed] = useState<Array<{ id: string; label: string; error: string }>>([]);
  const [finished, setFinished] = useState(false);

  const run = async () => {
    setRunning(true);
    setFinished(false);
    const skip: string[] = failed.map((f) => f.id);
    const fails = [...failed];
    let total = imported;
    for (let round = 0; round < 200; round++) {
      const res = await importTaggedItemsBatch(skip);
      if (!res.ok) {
        fails.push({ id: "-", label: "Import", error: res.error });
        setFailed([...fails]);
        break;
      }
      total += res.imported;
      setImported(total);
      setRemaining(res.remaining);
      for (const f of res.failed) {
        skip.push(f.id);
        fails.push(f);
      }
      setFailed([...fails]);
      if (res.remaining === 0) break;
    }
    setRunning(false);
    setFinished(true);
  };

  // One failure row per product, not per tag.
  const failedProducts = Array.from(new Map(failed.map((f) => [f.label, f])).values());

  return (
    <section className="rounded-2xl border border-border bg-background-secondary p-5 space-y-3">
      <p className="text-sm text-foreground-muted max-w-2xl">
        Lägger in plaggen från dina publicerade outfits i plaggbanken ({initialPending}{" "}
        taggar har en bild men är inte kopplade än). Samma produkt i flera outfits blir ett
        plagg. Plagg från hem-inlägg hoppas över.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={primaryBtn} onClick={run} disabled={running}>
          {running ? "Importerar…" : finished ? "Kör igen" : "Starta import"}
        </button>
        {(running || finished) && (
          <p className="text-sm text-foreground">
            Importerade: {imported}
            {remaining !== null && ` · Kvar: ${remaining}`}
            {failedProducts.length > 0 && ` · Misslyckades: ${failedProducts.length}`}
          </p>
        )}
        {finished && (
          <button type="button" className={secondaryBtn} onClick={onDone}>
            Ladda om listan
          </button>
        )}
      </div>
      {failedProducts.length > 0 && (
        <ul className="text-xs text-red-500 space-y-1 max-h-48 overflow-auto">
          {failedProducts.map((f) => (
            <li key={f.label}>
              {f.label}: {f.error}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Grid + filters                                                      */
/* ------------------------------------------------------------------ */

type Sort = "new" | "used" | "brand";

function CatalogGrid({
  items,
  onOpen,
}: {
  items: CatalogItem[];
  onOpen: (item: CatalogItem) => void;
}) {
  const [q, setQ] = useState("");
  const [garment, setGarment] = useState("");
  const [color, setColor] = useState("");
  const [gender, setGender] = useState("");
  const [archived, setArchived] = useState(false);
  const [sort, setSort] = useState<Sort>("new");

  const garmentsInUse = useMemo(
    () => GARMENT_OPTIONS.filter((g) => items.some((i) => i.garment === g)),
    [items],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = items.filter((i) => {
      if (i.isArchived !== archived) return false;
      if (garment && i.garment !== garment) return false;
      if (color && (i.color ?? "").toLowerCase() !== color.toLowerCase()) return false;
      if (gender === "unisex" && i.gender !== null) return false;
      if ((gender === "herr" || gender === "dam") && i.gender !== gender && i.gender !== null) return false;
      if (needle && !`${i.brand} ${i.name} ${i.garment} ${i.color ?? ""}`.toLowerCase().includes(needle)) {
        return false;
      }
      return true;
    });
    if (sort === "used") list.sort((a, b) => b.usage - a.usage);
    if (sort === "brand") list.sort((a, b) => a.brand.localeCompare(b.brand, "sv"));
    return list;
  }, [items, q, garment, color, gender, archived, sort]);

  const activeCount = items.filter((i) => !i.isArchived).length;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          {activeCount} plagg
          {items.length !== activeCount && (
            <span className="text-foreground-subtle font-normal"> · {items.length - activeCount} arkiverade</span>
          )}
        </h2>
        <p className="text-xs text-foreground-subtle">Visar {filtered.length}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
          <input className={`${inputCls} pl-9`} placeholder="Sök märke, namn…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={inputCls} value={garment} onChange={(e) => setGarment(e.target.value)}>
          <option value="">Alla typer</option>
          {garmentsInUse.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select className={inputCls} value={color} onChange={(e) => setColor(e.target.value)}>
          <option value="">Alla färger</option>
          {GARMENT_COLORS.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        <select className={inputCls} value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Alla kön</option>
          <option value="herr">Herr (inkl. unisex)</option>
          <option value="dam">Dam (inkl. unisex)</option>
          <option value="unisex">Bara unisex</option>
        </select>
        <select className={inputCls} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="new">Nyast</option>
          <option value="used">Mest använda</option>
          <option value="brand">Märke A–Ö</option>
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-foreground-muted px-1">
          <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
          Arkiverade
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-foreground-muted py-10 text-center">
          {items.length === 0
            ? "Plaggbanken är tom. Lägg till plagg via länkar eller importera från befintliga outfits."
            : "Inga plagg matchar filtret."}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => onOpen(i)}
              className="text-left group"
            >
              <CatalogThumb
                src={i.imageUrl}
                bg={i.imageBg}
                alt={i.name}
                className="aspect-[3/4] rounded-xl border border-border group-hover:border-foreground/40 transition-colors"
              />
              <p className="mt-1.5 text-[11px] uppercase tracking-wide text-foreground-subtle truncate">{i.brand}</p>
              <p className="text-sm text-foreground truncate">{i.name}</p>
              <p className="text-xs text-foreground-subtle truncate">
                {i.garment}
                {i.color ? ` · ${i.color}` : ""}
                {i.price != null ? ` · ${i.price} ${i.currency}` : ""}
                {i.usage > 0 ? ` · i ${i.usage} outfit${i.usage === 1 ? "" : "s"}` : ""}
              </p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Edit dialog                                                         */
/* ------------------------------------------------------------------ */

function EditDialog({
  item,
  onClose,
  onSaved,
  onArchived,
  onDeleted,
}: {
  item: CatalogItem;
  onClose: () => void;
  onSaved: (item: CatalogItem) => void;
  onArchived: (archived: boolean) => void;
  onDeleted: () => void;
}) {
  const [f, setF] = useState({
    brand: item.brand,
    name: item.name,
    garment: item.garment,
    gender: item.gender ?? "",
    color: item.color ?? "",
    material: item.material ?? "",
    price: item.price != null ? String(item.price) : "",
    currency: item.currency,
    buyUrl: item.buyUrl ?? "",
  });
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);

  const applyEditedImage = async (file: File) => {
    const fd = new FormData();
    fd.set("image", file);
    const res = await replaceCatalogImage(item.id, fd);
    if (!res.ok) throw new Error(res.error);
    onSaved(res.item);
  };

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel.");
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    run(async () => {
      const res = await updateCatalogItem(item.id, {
        ...f,
        gender: (f.gender || null) as Gender | null,
      });
      if (!res.ok) throw new Error(res.error);
      onSaved(res.item);
      onClose();
    });

  const swapImage = (file: File | null) =>
    run(async () => {
      const fd = new FormData();
      if (file) fd.set("image", await shrinkForUpload(file));
      else fd.set("imageUrl", imageUrl.trim());
      const res = await replaceCatalogImage(item.id, fd);
      if (!res.ok) throw new Error(res.error);
      setImageUrl("");
      onSaved(res.item);
    });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4"
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Redigera ${item.name}`}
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-auto rounded-2xl bg-background p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Redigera plagg</h2>
          <button type="button" onClick={onClose} aria-label="Stäng" className="text-foreground-subtle hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            <CatalogThumb
              src={item.imageUrl}
              bg={item.imageBg}
              alt={item.name}
              className="aspect-[3/4] rounded-xl border border-border"
            />
            <button
              type="button"
              className={`${secondaryBtn} w-full`}
              disabled={busy}
              onClick={() => setCropping(true)}
            >
              <Crop className="h-4 w-4" /> Beskär
            </button>
            {item.imageBg !== "transparent" && (
              <button
                type="button"
                className={`${secondaryBtn} w-full`}
                disabled={busy}
                onClick={() => setRemovingBg(true)}
              >
                <Eraser className="h-4 w-4" /> Ta bort bakgrund
              </button>
            )}
            <label className={`${secondaryBtn} w-full cursor-pointer`}>
              <Upload className="h-4 w-4" /> Byt bild
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                disabled={busy}
                onChange={(e) => e.target.files?.[0] && swapImage(e.target.files[0])}
              />
            </label>
            <div className="flex gap-1">
              <input
                className={`${inputCls} text-xs`}
                placeholder="…eller bildlänk"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <button
                type="button"
                className={secondaryBtn}
                disabled={busy || !imageUrl.trim()}
                onClick={() => swapImage(null)}
              >
                OK
              </button>
            </div>
            <p className="text-xs text-foreground-subtle">
              Används i {item.usage} outfit{item.usage === 1 ? "" : "s"}.
            </p>
          </div>
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Märke</label>
                <input className={inputCls} value={f.brand} onChange={(e) => set("brand", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Namn</label>
                <input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Typ</label>
                <select className={inputCls} value={f.garment} onChange={(e) => set("garment", e.target.value)}>
                  {(GARMENT_OPTIONS.includes(f.garment) ? GARMENT_OPTIONS : [f.garment, ...GARMENT_OPTIONS]).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Kön</label>
                <select className={inputCls} value={f.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option value="herr">Herr</option>
                  <option value="dam">Dam</option>
                  <option value="">Unisex</option>
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className={labelCls}>Pris</label>
                  <input className={inputCls} inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value)} />
                </div>
                <div className="w-20">
                  <label className={labelCls}>Valuta</label>
                  <input className={inputCls} value={f.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Material</label>
                <input className={inputCls} value={f.material} onChange={(e) => set("material", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Köplänk</label>
                <div className="flex gap-2">
                  <input className={inputCls} value={f.buyUrl} onChange={(e) => set("buyUrl", e.target.value)} />
                  {item.buyUrl && (
                    <a href={item.buyUrl} target="_blank" rel="noopener noreferrer" className={secondaryBtn} aria-label="Öppna länk">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className={labelCls}>Färg</label>
              <ColorPicker value={f.color} onChange={(c) => set("color", c)} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  className={secondaryBtn}
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const res = await setCatalogArchived(item.id, !item.isArchived);
                      if (!res.ok) throw new Error(res.error);
                      onArchived(!item.isArchived);
                    })
                  }
                >
                  {item.isArchived ? "Återställ" : "Arkivera"}
                </button>
                {confirmDelete ? (
                  <button
                    type="button"
                    className="inline-flex items-center rounded-full bg-red-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        const res = await deleteCatalogItem(item.id);
                        if (!res.ok) throw new Error(res.error);
                        onDeleted();
                      })
                    }
                  >
                    Bekräfta radering
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-sm text-red-500 px-2 disabled:opacity-50"
                    disabled={busy}
                    onClick={() => setConfirmDelete(true)}
                  >
                    Radera
                  </button>
                )}
              </div>
              <button type="button" className={primaryBtn} onClick={save} disabled={busy}>
                {busy ? "Sparar…" : "Spara"}
              </button>
            </div>
            {cropping && (
              <CropDialog
                src={item.imageUrl}
                title={item.name}
                onCancel={() => setCropping(false)}
                onCropped={async (file) => {
                  await applyEditedImage(file);
                  setCropping(false);
                }}
              />
            )}
            {removingBg && (
              <BgRemoveDialog
                src={item.imageUrl}
                title={item.name}
                onCancel={() => setRemovingBg(false)}
                onDone={async (file) => {
                  await applyEditedImage(file);
                  setRemovingBg(false);
                }}
              />
            )}
            {item.usage > 0 && confirmDelete && (
              <p className="text-xs text-foreground-subtle">
                Outfits som använder plagget påverkas inte. Taggen ligger kvar, men kopplingen till plaggbanken försvinner.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
