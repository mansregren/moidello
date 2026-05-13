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

export interface OutfitForm {
  id: string;
  title: string;
  description: string;
  category: string;
  gender: "dam" | "herr";
  is_published: boolean;
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

const GARMENTS = [
  "Toppar",
  "Byxor",
  "Skor",
  "Accessoarer",
  "Ytterkläder",
  "Klänningar",
  "Väskor",
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
        category: form.category || null,
        gender: form.gender,
        is_published: form.is_published,
      });
      if (res.ok) {
        setSuccess("Sparat.");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

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
            rows={4}
            maxLength={2000}
            className={`${INPUT} resize-none`}
          />
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
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) =>
              setForm({ ...form, is_published: e.target.checked })
            }
            className="h-4 w-4 rounded border-border bg-background-tertiary accent-white"
          />
          <span className="text-sm text-white">Publicerad</span>
        </label>

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
        garment: tag.garment,
        is_affiliate: tag.is_affiliate,
      });
      setBusyId(null);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  };

  const removeTag = (id: string) => {
    if (!confirm("Ta bort den här taggen?")) return;
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
            className="rounded-xl border border-border bg-background-tertiary p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-foreground-subtle">
                {t.garment}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-foreground-muted">
                <MousePointerClick className="h-3 w-3" />
                {(t.click_count ?? 0).toLocaleString("sv-SE")} klick
              </span>
            </div>

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
            <input
              type="url"
              placeholder="Köp-URL"
              value={t.buy_url ?? ""}
              onChange={(e) =>
                patch(t.id, { buy_url: e.target.value || null })
              }
              className={INPUT}
            />
            <div className="grid grid-cols-2 gap-2">
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
            </div>
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

  const startDrag = (e: React.PointerEvent<HTMLDivElement>, tagId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const onMove = (ev: PointerEvent) => {
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
                onPointerDown={(e) => startDrag(e, tag.id)}
                className="cursor-grab active:cursor-grabbing"
                title={`${tag.brand || "(utan märke)"} — ${tag.garment}`}
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
