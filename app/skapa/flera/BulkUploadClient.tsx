"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { createOutfitsBatch, type BulkResult } from "./actions";

const CATEGORIES = [
  "Vardag",
  "Fest",
  "Sommar",
  "Vinter",
  "Träning",
  "Arbete",
  "Helg",
  "Annat",
];

const MAX_ITEMS = 10;

interface Draft {
  file: File;
  previewUrl: string;
  title: string;
  category: string;
  gender: "dam" | "herr";
}

export function BulkUploadClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<BulkResult | null>(null);

  const handlePickFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).slice(0, MAX_ITEMS - drafts.length);
    const next: Draft[] = incoming.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      title: file.name.replace(/\.[^.]+$/, "").slice(0, 80),
      category: "Annat",
      gender: "dam",
    }));
    setDrafts((prev) => [...prev, ...next]);
  };

  const updateDraft = (i: number, patch: Partial<Draft>) => {
    setDrafts((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)),
    );
  };

  const removeDraft = (i: number) => {
    setDrafts((prev) => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (drafts.length === 0) return;

    startTransition(async () => {
      const fd = new FormData();
      drafts.forEach((d) => fd.append("images", d.file));
      fd.append(
        "meta",
        JSON.stringify(
          drafts.map((d) => ({
            title: d.title,
            category: d.category,
            gender: d.gender,
          })),
        ),
      );

      const res = await createOutfitsBatch(fd);
      setResult(res);

      if (res.ok && res.errors.length === 0 && res.redirectUsername) {
        // Clean break to profile so the user sees the new outfits.
        router.push(`/profile/${res.redirectUsername}`);
      }
    });
  };

  if (result && result.created.length > 0) {
    return (
      <div className="mt-10 space-y-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-white">
                {result.created.length} outfit
                {result.created.length === 1 ? "" : "s"} publicerade.
              </p>
              <ul className="mt-3 space-y-1.5">
                {result.created.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={
                        c.slug && result.redirectUsername
                          ? `/${result.redirectUsername}/${c.slug}`
                          : `/outfit/${c.id}`
                      }
                      className="text-sm text-emerald-300 hover:underline"
                    >
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {result.errors.length > 0 && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.05] p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white">
                  {result.errors.length} bild
                  {result.errors.length === 1 ? "" : "er"} kunde inte
                  publiceras:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-red-300">
                  {result.errors.map((e, idx) => (
                    <li key={idx}>
                      #{e.index + 1}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setResult(null);
            setDrafts([]);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2.5 text-sm font-semibold hover:bg-white/90"
        >
          Ladda upp fler
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
      {/* File picker / drop zone */}
      <label
        htmlFor="bulk-images"
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-background-secondary p-10 text-center cursor-pointer hover:border-white/30 transition-colors"
      >
        <Upload className="h-8 w-8 text-foreground-muted" />
        <p className="text-sm text-white">
          {drafts.length === 0
            ? "Klicka för att välja bilder, eller släpp dem här"
            : `${drafts.length} av ${MAX_ITEMS} valda — klicka för att lägga till`}
        </p>
        <p className="text-xs text-foreground-subtle">
          JPG, PNG eller WebP · max 10 MB per bild
        </p>
        <input
          id="bulk-images"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            handlePickFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {drafts.length > 0 && (
        <>
          <ul className="space-y-3">
            {drafts.map((d, i) => (
              <li
                key={d.previewUrl}
                className="rounded-2xl border border-border bg-background-secondary p-4 flex gap-4"
              >
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-background-tertiary">
                  <Image
                    src={d.previewUrl}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    type="text"
                    value={d.title}
                    onChange={(e) => updateDraft(i, { title: e.target.value })}
                    placeholder="Titel"
                    maxLength={80}
                    required
                    className="w-full rounded-lg bg-background-tertiary border border-border text-sm text-white placeholder:text-foreground-subtle px-3 py-2 outline-none focus:border-white/30"
                  />
                  <div className="flex gap-2">
                    <select
                      value={d.category}
                      onChange={(e) =>
                        updateDraft(i, { category: e.target.value })
                      }
                      className="flex-1 rounded-lg bg-background-tertiary border border-border text-xs text-white px-3 py-2 outline-none focus:border-white/30"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <select
                      value={d.gender}
                      onChange={(e) =>
                        updateDraft(i, {
                          gender: e.target.value as "dam" | "herr",
                        })
                      }
                      className="rounded-lg bg-background-tertiary border border-border text-xs text-white px-3 py-2 outline-none focus:border-white/30"
                    >
                      <option value="dam">Dam</option>
                      <option value="herr">Herr</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeDraft(i)}
                  aria-label="Ta bort"
                  className="shrink-0 self-start text-foreground-subtle hover:text-red-400 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pending || drafts.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-white/90 disabled:opacity-60"
            >
              {pending
                ? "Publicerar…"
                : `Publicera ${drafts.length} ${drafts.length === 1 ? "outfit" : "outfits"}`}
            </button>
            <Link
              href="/skapa"
              className="text-sm text-foreground-muted hover:text-white"
            >
              Eller skapa en med plagg-taggar →
            </Link>
          </div>

          {result && result.errors.length > 0 && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.05] p-4">
              <p className="text-xs text-red-300">
                Vissa misslyckades. Försök igen:
              </p>
              <ul className="mt-1 text-xs text-red-300">
                {result.errors.map((e, idx) => (
                  <li key={idx}>
                    {e.index >= 0 ? `#${e.index + 1}` : ""}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </form>
  );
}
