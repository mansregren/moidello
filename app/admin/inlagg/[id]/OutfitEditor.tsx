"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Save, Trash2, MousePointerClick, Check, Loader2 } from "lucide-react";
import {
  updateOutfit,
  deleteOutfit,
  updateTaggedItem,
  updateTaggedItemPosition,
  deleteTaggedItem,
} from "@/app/actions/admin-content";
import { GARMENTS } from "@/lib/garments";

export interface OutfitForm {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  gender: "dam" | "herr";
  is_published: boolean;
  scheduled_for: string | null;
}

export interface TagPosition {
  id: string;
  brand: string;
  garment: string;
  x: number;
  y: number;
}

export interface TagForm {
  id: string;
  brand: string;
  name: string;
  buy_url: string | null;
  price: number | null;
  currency: string | null;
  garment: string;
  is_affiliate: boolean;
  color?: string | null;
  image_url?: string | null;
  retailer?: string | null;
  retailer_locale?: string | null;
  click_count?: number;
}

const CATEGORIES = [
  "Streetwear",
  "Minimalism",
  "Vintage",
  "Casual",
  "Formal",
  "Sporty",
  "Bohemian",
  "Preppy",
];

const INPUT =
  "w-full rounded-xl bg-background-tertiary border border-border text-sm text-white placeholder:text-foreground-subtle p-3 outline-none focus:border-white/30";

export function OutfitEditor({ outfit }: { outfit: OutfitForm }) {
  const router = useRouter();
  const [form, setForm] = useState(outfit);
  const [pending, startTransition] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateOutfit(outfit.id, {
        title: form.title,
        description: form.description || null,
        keywords: form.keywords,
        category: form.category || null,
        gender: form.gender,
        is_published: form.is_published,
        scheduled_for: form.scheduled_for,
      });
      if (res.ok) {
        setSuccess("Sparat.");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const addKeyword = (k: string) => {
    const cleaned = k.trim().toLowerCase();
    if (!cleaned) return;
    if (form.keywords.includes(cleaned)) return;
    if (form.keywords.length >= 10) return;
    setForm({ ...form, keywords: [...form.keywords, cleaned] });
  };
  const removeKeyword = (k: string) =>
    setForm({ ...form, keywords: form.keywords.filter((x) => x !== k) });

  const handleDelete = () => {
    if (
      !confirm(
        "Radera inlägget permanent? Alla taggar, kommentarer och klick raderas också.",
      )
    )
      return;
    setError(null);
    startDeleting(async () => {
      const res = await deleteOutfit(outfit.id);
      if (res.ok) router.push("/admin/inlagg");
      else setError(res.error);
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-background-secondary p-6">
      <h2 className="font-heading text-xl uppercase tracking-tight text-white mb-5">
        Redigera inlägg
      </h2>
      <form onSubmit={save} className="space-y-4">
        <Field label="Titel">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className={INPUT}
          />
        </Field>
        <Field label="Beskrivning">
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            rows={3}
            maxLength={2000}
            className={`${INPUT} resize-none`}
          />
        </Field>

        <Field
          label={`Keywords (${form.keywords.length}/10)`}
        >
          <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-background-tertiary border border-border min-h-[44px]">
            {form.keywords.map((k) => (
              <span
                key={k}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 text-white px-2 py-0.5 text-xs"
              >
                {k}
                <button
                  type="button"
                  onClick={() => removeKeyword(k)}
                  className="text-white/60 hover:text-white"
                  aria-label={`Ta bort ${k}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder={
                form.keywords.length >= 10
                  ? "Max 10 keywords"
                  : "Skriv + Enter"
              }
              disabled={form.keywords.length >= 10}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  const v = (e.target as HTMLInputElement).value;
                  addKeyword(v);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  addKeyword(e.target.value);
                  e.target.value = "";
                }
              }}
              className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder:text-foreground-subtle outline-none"
            />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Kategori">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={INPUT}
            >
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kön">
            <select
              value={form.gender}
              onChange={(e) =>
                setForm({ ...form, gender: e.target.value as "dam" | "herr" })
              }
              className={INPUT}
            >
              <option value="dam">Dam</option>
              <option value="herr">Herr</option>
            </select>
          </Field>
        </div>
        <Field label="Status">
          <div className="flex flex-wrap gap-2">
            <StatusButton
              active={!form.is_published && !form.scheduled_for}
              onClick={() =>
                setForm({ ...form, is_published: false, scheduled_for: null })
              }
              label="Utkast"
              tone="amber"
            />
            <StatusButton
              active={!form.is_published && !!form.scheduled_for}
              onClick={() =>
                setForm({
                  ...form,
                  is_published: false,
                  scheduled_for:
                    form.scheduled_for ??
                    new Date(Date.now() + 86400000).toISOString(),
                })
              }
              label="Schemalagd"
              tone="blue"
            />
            <StatusButton
              active={form.is_published}
              onClick={() =>
                setForm({ ...form, is_published: true, scheduled_for: null })
              }
              label="Publicerad"
              tone="emerald"
            />
          </div>
        </Field>

        {!form.is_published && !!form.scheduled_for && (
          <Field label="Schemalagd publicering">
            <input
              type="datetime-local"
              value={
                form.scheduled_for
                  ? new Date(form.scheduled_for).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) => {
                const v = e.target.value;
                setForm({
                  ...form,
                  scheduled_for: v ? new Date(v).toISOString() : null,
                });
              }}
              className={INPUT}
            />
            <p className="mt-1 text-[11px] text-foreground-subtle">
              OBS: Schemaläggnings-jobbet körs inte automatiskt än —
              cron-tasken är inte aktiverad. Tills dess publiceras posten
              först när admin trycker Publicerad manuellt.
            </p>
          </Field>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}
        {success && <p className="text-xs text-emerald-300">{success}</p>}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {pending ? "Sparar…" : "Spara"}
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-full border border-red-500/30 text-red-400 px-4 py-2 text-sm font-semibold hover:bg-red-500/10 disabled:opacity-60 ml-auto"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Raderar…" : "Radera inlägg"}
          </button>
        </div>
      </form>
    </section>
  );
}

export function TagsEditor({
  outfitId: _outfitId,
  tags: initialTags,
}: {
  outfitId: string;
  tags: TagForm[];
}) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const patch = (id: string, p: Partial<TagForm>) =>
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, ...p } : t)));

  const saveTag = (tag: TagForm) => {
    setError(null);
    setBusyId(tag.id);
    startTransition(async () => {
      const res = await updateTaggedItem(tag.id, {
        brand: tag.brand,
        name: tag.name,
        buy_url: tag.buy_url,
        price: tag.price,
        currency: tag.currency,
        color: tag.color ?? null,
        image_url: tag.image_url ?? null,
        garment: tag.garment,
        is_affiliate: tag.is_affiliate,
        retailer: tag.retailer ?? null,
        retailer_locale: tag.retailer_locale ?? null,
      });
      setBusyId(null);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  };

  const removeTag = (id: string) => {
    const tag = tags.find((t) => t.id === id);
    if (
      !confirm(
        `Radera plagg-tag${tag ? ` "${tag.brand} ${tag.name}"` : ""} permanent? Detta kan inte ångras.`,
      )
    )
      return;
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const res = await deleteTaggedItem(id);
      setBusyId(null);
      if (res.ok) {
        setTags((prev) => prev.filter((t) => t.id !== id));
      } else {
        setError(res.error);
      }
    });
  };

  // When the admin pastes a new URL into a tag's buy_url field, re-fetch
  // preview meta from our endpoint so price/brand/image AND retailer refresh.
  // Retailer + locale are critical for geo-redirect in /go to actually
  // rewrite — without them the /go route falls through and 302s the raw URL.
  const refetchFromUrl = async (tagId: string, url: string) => {
    if (!/^https?:\/\//i.test(url)) return;
    setBusyId(tagId);
    try {
      const res = await fetch("/api/admin/items/preview-from-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        brand?: string | null;
        product_name?: string | null;
        price?: number | null;
        currency?: string | null;
        color?: string | null;
        image_url?: string | null;
        retailer?: string | null;
        retailer_locale?: string | null;
      };
      patch(tagId, {
        brand: data.brand || tags.find((t) => t.id === tagId)?.brand || "",
        name: data.product_name || tags.find((t) => t.id === tagId)?.name || "",
        price: data.price ?? null,
        currency: data.currency ?? "SEK",
        color: data.color ?? null,
        image_url: data.image_url ?? null,
        retailer: data.retailer ?? null,
        retailer_locale: data.retailer_locale ?? null,
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-background-secondary p-6">
      <h2 className="font-heading text-xl uppercase tracking-tight text-white mb-2">
        Taggade plagg ({tags.length})
      </h2>
      <p className="text-xs text-foreground-subtle mb-5">
        Ändringar sparas per plagg. Dra punkterna på bilden ovan för att
        flytta tag-positioner.
      </p>

      {error && <p className="text-xs text-red-400 mb-4">{error}</p>}

      {tags.length === 0 && (
        <p className="text-sm text-foreground-subtle">Inga taggade plagg.</p>
      )}

      <ul className="space-y-4">
        {tags.map((t) => (
          <li
            key={t.id}
            id={`tag-card-${t.id}`}
            className="rounded-xl border border-border bg-background-tertiary p-4 space-y-3 transition-colors focus-within:border-white/40 focus-within:bg-background-tertiary/80 hover:border-white/20 scroll-mt-24"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wider text-foreground-subtle">
                {t.garment}
              </span>
              <TagStatusBadge
                isAffiliate={t.is_affiliate}
                retailer={t.retailer ?? null}
                locale={t.retailer_locale ?? null}
              />
              <span className="inline-flex items-center gap-1 text-[11px] text-foreground-muted ml-auto">
                <MousePointerClick className="h-3 w-3" />
                {(t.click_count ?? 0).toLocaleString("sv-SE")} klick
              </span>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-3">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-background border border-border">
                {t.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.image_url}
                    alt={t.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] text-foreground-subtle">
                    Ingen bild
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Märke"
                    value={t.brand}
                    onChange={(e) => patch(t.id, { brand: e.target.value })}
                    className={INPUT}
                  />
                  <select
                    value={t.garment}
                    onChange={(e) => patch(t.id, { garment: e.target.value })}
                    className={INPUT}
                  >
                    {GARMENTS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Plaggnamn"
                  value={t.name}
                  onChange={(e) => patch(t.id, { name: e.target.value })}
                  className={INPUT}
                />
              </div>
            </div>

            <div className="relative">
              <input
                type="url"
                placeholder="Köp-URL — klistra in för att uppdatera meta"
                value={t.buy_url ?? ""}
                onChange={(e) =>
                  patch(t.id, { buy_url: e.target.value || null })
                }
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text").trim();
                  if (pasted && /^https?:\/\//i.test(pasted)) {
                    e.preventDefault();
                    patch(t.id, { buy_url: pasted });
                    refetchFromUrl(t.id, pasted);
                  }
                }}
                className={INPUT}
              />
              {busyId === t.id && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] text-foreground-muted">
                  Hämtar…
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="Pris"
                min="0"
                step="1"
                value={t.price ?? ""}
                onChange={(e) =>
                  patch(t.id, {
                    price:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className={INPUT}
              />
              <input
                type="text"
                placeholder="SEK"
                maxLength={8}
                value={t.currency ?? ""}
                onChange={(e) =>
                  patch(t.id, { currency: e.target.value || null })
                }
                className={INPUT}
              />
              <input
                type="text"
                placeholder="Färg"
                value={t.color ?? ""}
                onChange={(e) =>
                  patch(t.id, { color: e.target.value || null })
                }
                className={INPUT}
              />
            </div>
            <input
              type="url"
              placeholder="Bild-URL"
              value={t.image_url ?? ""}
              onChange={(e) =>
                patch(t.id, { image_url: e.target.value || null })
              }
              className={INPUT}
            />
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={t.is_affiliate}
                onChange={(e) =>
                  patch(t.id, { is_affiliate: e.target.checked })
                }
                className="h-4 w-4 rounded border-border bg-background-secondary accent-white"
              />
              <span className="text-xs text-foreground-muted">
                Affiliatelänk (visas som &quot;Reklam&quot;)
              </span>
            </label>

            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                type="button"
                disabled={busyId === t.id}
                onClick={() => saveTag(t)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white text-black px-3 py-1.5 text-xs font-semibold hover:bg-white/90 disabled:opacity-60"
              >
                <Save className="h-3 w-3" />
                Spara plagg
              </button>
              <button
                type="button"
                disabled={busyId === t.id}
                onClick={() => removeTag(t.id)}
                aria-label={`Radera ${t.brand} ${t.name}`.trim()}
                className="ml-auto inline-flex items-center justify-center rounded-full border border-red-500/30 text-red-400 h-7 w-7 hover:bg-red-500/10 disabled:opacity-60"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TagPositionEditor({
  imageUrl,
  title,
  isPublished,
  tags: initialTags,
}: {
  imageUrl: string;
  title: string;
  isPublished: boolean;
  tags: TagPosition[];
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tags, setTags] = useState(initialTags);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [justSavedId, setJustSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state if server data changes after a router.refresh()
  useEffect(() => {
    setTags(initialTags);
    setDirty(new Set());
  }, [initialTags]);

  // Pointer-down on a pin opens either a click (focus matching tag card) or a
  // drag (move the pin) depending on movement distance. Threshold is in px,
  // measured from initial pointer position — under it = click, over it = drag.
  const CLICK_THRESHOLD_PX = 5;

  const focusTagCard = (tagId: string) => {
    const el = document.getElementById(`tag-card-${tagId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Wait a frame for the scroll to settle so focus doesn't fight it.
    requestAnimationFrame(() => {
      const firstInput = el.querySelector<HTMLInputElement | HTMLSelectElement>(
        "input, select, textarea",
      );
      firstInput?.focus();
    });
  };

  const startPointer = (
    e: React.PointerEvent<HTMLDivElement>,
    tagId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let dragging = false;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!dragging && Math.hypot(dx, dy) < CLICK_THRESHOLD_PX) return;
      dragging = true;
      // Re-read the rect each frame so scroll/resize during the drag
      // doesn't snap the dot to a stale position.
      const rect = container.getBoundingClientRect();
      const xPct = ((ev.clientX - rect.left) / rect.width) * 100;
      const yPct = ((ev.clientY - rect.top) / rect.height) * 100;
      const clamp = (v: number) => Math.max(2, Math.min(98, v));
      setTags((prev) =>
        prev.map((t) =>
          t.id === tagId ? { ...t, x: clamp(xPct), y: clamp(yPct) } : t,
        ),
      );
      setDirty((prev) => {
        if (prev.has(tagId)) return prev;
        const next = new Set(prev);
        next.add(tagId);
        return next;
      });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (!dragging) focusTagCard(tagId);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const save = async (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;
    setError(null);
    setSavingId(tagId);
    const res = await updateTaggedItemPosition(tag.id, tag.x, tag.y);
    setSavingId(null);
    if (res.ok) {
      setDirty((prev) => {
        const next = new Set(prev);
        next.delete(tagId);
        return next;
      });
      setJustSavedId(tagId);
      setTimeout(() => setJustSavedId((id) => (id === tagId ? null : id)), 1500);
      router.refresh();
    } else {
      setError(res.error);
    }
  };

  const saveAll = async () => {
    const ids = Array.from(dirty);
    if (ids.length === 0) return;
    for (const id of ids) {
      await save(id);
    }
  };

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-background-tertiary select-none touch-none"
      >
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover pointer-events-none"
          priority
          unoptimized={imageUrl.startsWith("http")}
          draggable={false}
        />

        {!isPublished && (
          <span className="absolute top-3 left-3 inline-flex rounded-full bg-amber-500/90 text-black px-3 py-1 text-xs uppercase tracking-wider font-semibold pointer-events-none">
            Utkast
          </span>
        )}

        {tags.map((tag, i) => {
          const isDirty = dirty.has(tag.id);
          const isSaving = savingId === tag.id;
          const isSaved = justSavedId === tag.id;
          return (
            <div
              key={tag.id}
              className="absolute"
              style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
            >
              <div
                onPointerDown={(e) => startPointer(e, tag.id)}
                className="cursor-pointer active:cursor-grabbing"
                title={`${tag.brand || "(utan märke)"} — klick = redigera, drag = flytta`}
              >
                <span
                  className={`absolute inset-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                    isDirty ? "bg-amber-300/50" : "bg-white/40"
                  } animate-ping`}
                />
                <span
                  className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] ${
                    isDirty ? "bg-amber-300" : "bg-white"
                  }`}
                />
              </div>
              <div className="absolute left-3 top-3 flex items-center gap-1 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-medium text-white shadow-lg backdrop-blur-sm">
                <span>#{i + 1}</span>
                <span className="text-white/60">·</span>
                <span className="truncate max-w-[8rem]">
                  {tag.brand || "(utan märke)"}
                </span>
                {isDirty && (
                  <button
                    type="button"
                    onClick={() => save(tag.id)}
                    disabled={isSaving}
                    className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-300 text-black px-2 py-0.5 text-[10px] font-semibold hover:bg-amber-200 disabled:opacity-60"
                  >
                    {isSaving ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : (
                      <Save className="h-2.5 w-2.5" />
                    )}
                    Spara
                  </button>
                )}
                {isSaved && !isDirty && (
                  <span className="ml-1 inline-flex items-center gap-1 text-emerald-300">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs">
        <p className="text-foreground-subtle">
          Dra punkterna för att flytta tag-positioner. Ändringar sparas per punkt.
        </p>
        {dirty.size > 0 && (
          <button
            type="button"
            onClick={saveAll}
            disabled={savingId !== null}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 text-black px-3 py-1.5 text-xs font-semibold hover:bg-amber-200 disabled:opacity-60"
          >
            <Save className="h-3 w-3" />
            Spara alla ({dirty.size})
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function TagStatusBadge({
  isAffiliate,
  retailer,
  locale,
}: {
  isAffiliate: boolean;
  retailer: string | null;
  locale: string | null;
}) {
  if (isAffiliate) {
    return (
      <span
        title="Affiliate-länk — pass-through, ingen rewrite"
        className="rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 px-2 py-0.5 text-[10px]"
      >
        Affiliate
      </span>
    );
  }
  if (retailer) {
    return (
      <span
        title={`Geo-anpassas automatiskt (${locale ?? "?"})`}
        className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 text-[10px]"
      >
        {retailer} {locale ? `· ${locale}` : ""}
      </span>
    );
  }
  return (
    <span
      title="Okänd retailer — länken skickas som-den-är"
      className="rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 text-[10px]"
    >
      Okänd
    </span>
  );
}

function StatusButton({
  active,
  onClick,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tone: "amber" | "blue" | "emerald";
}) {
  const tones: Record<string, { active: string; idle: string }> = {
    amber: {
      active: "bg-amber-500 text-black border-amber-500",
      idle: "border-amber-500/30 text-amber-300 hover:bg-amber-500/10",
    },
    blue: {
      active: "bg-blue-500 text-white border-blue-500",
      idle: "border-blue-500/30 text-blue-300 hover:bg-blue-500/10",
    },
    emerald: {
      active: "bg-emerald-500 text-black border-emerald-500",
      idle: "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10",
    },
  };
  const c = tones[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
        active ? c.active : c.idle
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}
