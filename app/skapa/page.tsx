"use client";

import { Upload, Eye, X, CheckCircle2, Plus, AlertTriangle, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { IconButton } from "@/components/shared/IconButton";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useGender } from "@/lib/gender-context";
import { resizeImageForUpload } from "@/lib/image-resize";
import { BrandAutocomplete } from "@/components/skapa/BrandAutocomplete";
import { createOutfit, type PublishedOutfit } from "./actions";

interface DemoTag {
  id: number;
  x: number;
  y: number;
  brand: string;
  name: string;
  url: string;
  garment: string;
  isAffiliate: boolean;
  regionUrls: Record<string, string>;
  showRegions: boolean;
}

interface Draft {
  id: number;
  file: File | null;
  previewUrl: string | null;
  title: string;
  description: string;
  category: string;
  tags: DemoTag[];
  status: "draft" | "publishing" | "published" | "error";
  published?: PublishedOutfit;
  error?: string;
}

const REGION_OPTIONS: { code: string; label: string }[] = [
  { code: "SE", label: "Sverige" },
  { code: "NO", label: "Norge" },
  { code: "DK", label: "Danmark" },
  { code: "FI", label: "Finland" },
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

const MAX_DRAFTS = 10;

let nextDraftId = 1;
function makeDraft(file: File | null = null): Draft {
  return {
    id: nextDraftId++,
    file,
    previewUrl: file ? URL.createObjectURL(file) : null,
    title: "",
    description: "",
    category: "",
    tags: [],
    status: "draft",
  };
}

export default function SkapaPage() {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();
  const { gender } = useGender();

  const [drafts, setDrafts] = useState<Draft[]>([makeDraft()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  // Reset preview mode when switching drafts so a half-edited tag form
  // doesn't leak over.
  useEffect(() => {
    setPreviewMode(false);
  }, [activeIndex]);

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push("/login");
    }
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    return () => {
      // Revoke all object URLs on unmount.
      for (const d of drafts) {
        if (d.previewUrl) URL.revokeObjectURL(d.previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = drafts[activeIndex] ?? drafts[0];
  const publishedCount = drafts.filter((d) => d.status === "published").length;
  const pendingDrafts = drafts.filter(
    (d) => d.status === "draft" || d.status === "error",
  );
  const canPublish =
    !publishing &&
    pendingDrafts.length > 0 &&
    pendingDrafts.every((d) => d.file && d.title.trim());

  const updateActive = (patch: Partial<Draft>) => {
    setDrafts((prev) =>
      prev.map((d, i) => (i === activeIndex ? { ...d, ...patch } : d)),
    );
  };

  const addFilesToDrafts = async (
    files: FileList,
    replaceFirstIfEmpty = false,
  ) => {
    setTopError(null);
    const arr = Array.from(files);

    // Resize in parallel — these run in the browser, no upload yet.
    const resized = await Promise.all(
      arr.map(async (f) => {
        try {
          return await resizeImageForUpload(f);
        } catch {
          return f;
        }
      }),
    );

    setDrafts((prev) => {
      const next = [...prev];
      let i = 0;

      // If the only existing draft is an empty placeholder (no file), use
      // it as the first slot instead of leaving an orphan tab.
      if (
        replaceFirstIfEmpty &&
        next.length === 1 &&
        next[0].file === null &&
        i < resized.length
      ) {
        if (next[0].previewUrl) URL.revokeObjectURL(next[0].previewUrl);
        next[0] = {
          ...next[0],
          file: resized[i],
          previewUrl: URL.createObjectURL(resized[i]),
        };
        i++;
      }

      while (i < resized.length && next.length < MAX_DRAFTS) {
        next.push(makeDraft(resized[i]));
        i++;
      }

      if (i < resized.length) {
        setTopError(`Bara ${MAX_DRAFTS} bilder åt gången.`);
      }
      return next;
    });
  };

  const handleInitialPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await addFilesToDrafts(e.target.files, true);
    setActiveIndex(0);
    e.target.value = "";
  };

  const handleAddMore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const before = drafts.length;
    await addFilesToDrafts(e.target.files);
    setActiveIndex(before);
    e.target.value = "";
  };

  const removeDraft = (index: number) => {
    setDrafts((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) return [makeDraft()];
      return next;
    });
    setActiveIndex((idx) => {
      if (drafts.length <= 1) return 0;
      if (index === idx) return Math.max(0, idx - 1);
      if (index < idx) return idx - 1;
      return idx;
    });
  };

  const replaceActiveImage = async (file: File) => {
    try {
      const resized = await resizeImageForUpload(file);
      if (active.previewUrl) URL.revokeObjectURL(active.previewUrl);
      updateActive({
        file: resized,
        previewUrl: URL.createObjectURL(resized),
      });
    } catch {
      updateActive({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
  };

  // ============ Tag manipulation ============

  const addTagAt = (xPct: number, yPct: number) => {
    const tag: DemoTag = {
      id: Date.now() + Math.random(),
      x: xPct,
      y: yPct,
      brand: "",
      name: "",
      url: "",
      garment: "Toppar",
      isAffiliate: false,
      regionUrls: {},
      showRegions: false,
    };
    updateActive({ tags: [...active.tags, tag] });
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (previewMode || !active.previewUrl) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const clamp = (v: number) => Math.max(2, Math.min(98, v));
    addTagAt(clamp(xPct), clamp(yPct));
  };

  const handleTagDragStart = (
    e: React.PointerEvent<HTMLDivElement>,
    tagId: number,
  ) => {
    if (previewMode) return;
    e.preventDefault();
    e.stopPropagation();
    const container = (e.currentTarget.parentElement?.parentElement ??
      e.currentTarget) as HTMLDivElement;
    const rect = container.getBoundingClientRect();

    const onMove = (ev: PointerEvent) => {
      const xPct = ((ev.clientX - rect.left) / rect.width) * 100;
      const yPct = ((ev.clientY - rect.top) / rect.height) * 100;
      const clamp = (v: number) => Math.max(2, Math.min(98, v));
      setDrafts((prev) =>
        prev.map((d, i) =>
          i === activeIndex
            ? {
                ...d,
                tags: d.tags.map((t) =>
                  t.id === tagId ? { ...t, x: clamp(xPct), y: clamp(yPct) } : t,
                ),
              }
            : d,
        ),
      );
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const removeTag = (id: number) =>
    updateActive({ tags: active.tags.filter((t) => t.id !== id) });

  const updateTag = (id: number, patch: Partial<DemoTag>) =>
    updateActive({
      tags: active.tags.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });

  const tagsForSubmit = (tags: DemoTag[]) =>
    tags
      .filter((t) => t.brand.trim() && t.name.trim())
      .map((t) => {
        const regionUrls: Record<string, string> = {};
        for (const [code, url] of Object.entries(t.regionUrls)) {
          if (url.trim()) regionUrls[code] = url.trim();
        }
        return {
          brand: t.brand,
          name: t.name,
          buyUrl: t.url,
          buyUrls: Object.keys(regionUrls).length > 0 ? regionUrls : undefined,
          garment: t.garment,
          x: t.x,
          y: t.y,
          isAffiliate: t.isAffiliate,
        };
      });

  // ============ Publish ============

  const setDraftStatus = (index: number, patch: Partial<Draft>) => {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );
  };

  const handlePublishAll = async () => {
    setTopError(null);
    setPublishing(true);
    try {
      for (let i = 0; i < drafts.length; i++) {
        const draft = drafts[i];
        if (draft.status === "published" || !draft.file || !draft.title.trim())
          continue;

        setDraftStatus(i, { status: "publishing", error: undefined });
        setActiveIndex(i);

        const fd = new FormData();
        fd.set("image", draft.file);
        fd.set("title", draft.title);
        fd.set("description", draft.description);
        fd.set("category", draft.category);
        fd.set("gender", gender);
        fd.set("tags", JSON.stringify(tagsForSubmit(draft.tags)));

        try {
          const result = await createOutfit({}, fd);
          if (result.success) {
            setDraftStatus(i, {
              status: "published",
              published: result.success,
            });
          } else {
            setDraftStatus(i, {
              status: "error",
              error: result.error ?? "Okänt fel",
            });
          }
        } catch (e) {
          setDraftStatus(i, {
            status: "error",
            error: e instanceof Error ? e.message : "Något gick fel",
          });
        }
      }
    } finally {
      setPublishing(false);
    }
  };

  if (loading || !isLoggedIn) {
    return (
      <>
        <Header />
        <main id="main" tabIndex={-1} className="flex-1" />
      </>
    );
  }

  const noImageYet = !active.file;
  const profileUsername = drafts.find((d) => d.published)?.published?.username;

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-6 md:pt-10">
        <Container className="max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-white mb-2">
              Skapa <span className="text-foreground-subtle">Outfit</span>
            </h1>
            <p className="text-foreground-muted mb-6">
              Ladda upp en eller flera bilder. Tagga plagg på varje, publicera
              allt samtidigt — varje outfit får sin egen URL.
            </p>
          </motion.div>

          {topError && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/[0.05] p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{topError}</p>
            </div>
          )}

          {publishedCount > 0 && (
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    {publishedCount}{" "}
                    {publishedCount === 1 ? "outfit" : "outfits"}{" "}
                    publicerad{publishedCount === 1 ? "" : "e"}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {drafts
                      .filter((d) => d.published)
                      .map((d) => (
                        <li key={d.id}>
                          <Link
                            href={d.published!.url}
                            className="text-xs text-emerald-300 hover:underline"
                          >
                            {d.published!.title}
                          </Link>
                        </li>
                      ))}
                  </ul>
                  {profileUsername && (
                    <div className="mt-3">
                      <Link
                        href={`/profile/${profileUsername}`}
                        className="text-xs text-white underline hover:text-white/80"
                      >
                        Visa min profil →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab strip — only show when there are real drafts */}
          {drafts.some((d) => d.file) && (
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
              {drafts.map((d, i) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`relative h-24 w-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all snap-start ${
                    i === activeIndex
                      ? "border-white"
                      : "border-transparent hover:border-white/30"
                  }`}
                >
                  {d.previewUrl ? (
                    <Image
                      src={d.previewUrl}
                      alt={`Bild ${i + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 bg-background-tertiary flex items-center justify-center text-foreground-subtle text-xs">
                      Tom
                    </div>
                  )}
                  <span className="absolute top-1 left-1 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-black/70 text-[10px] font-semibold text-white">
                    {i + 1}
                  </span>
                  {d.status === "published" && (
                    <CheckCircle2 className="absolute top-1 right-1 h-4 w-4 text-emerald-400 drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
                  )}
                  {d.status === "publishing" && (
                    <Loader2 className="absolute top-1 right-1 h-4 w-4 text-white animate-spin drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
                  )}
                  {d.status === "error" && (
                    <AlertTriangle className="absolute top-1 right-1 h-4 w-4 text-red-400 drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
                  )}
                  {drafts.length > 1 && d.status !== "publishing" && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDraft(i);
                      }}
                      role="button"
                      aria-label="Ta bort bild"
                      className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-black/70 hover:bg-red-500 flex items-center justify-center transition-colors"
                    >
                      <X className="h-3 w-3 text-white" />
                    </span>
                  )}
                </button>
              ))}
              {drafts.length < MAX_DRAFTS && (
                <label
                  htmlFor="add-more-input"
                  className="h-24 w-20 shrink-0 rounded-xl border-2 border-dashed border-border bg-background-secondary flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-white/30 transition-colors snap-start"
                >
                  <Plus className="h-5 w-5 text-foreground-muted" />
                  <span className="text-[10px] text-foreground-subtle">
                    Lägg till
                  </span>
                </label>
              )}
              <input
                id="add-more-input"
                ref={addMoreInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleAddMore}
              />
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Image upload + tag placement */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {noImageYet ? (
                <label
                  htmlFor="image-input"
                  className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-border bg-background-secondary flex flex-col items-center justify-center cursor-pointer hover:border-white/30 transition-colors group overflow-hidden"
                >
                  <Upload className="h-12 w-12 text-foreground-subtle mb-4 group-hover:text-foreground-muted transition-colors" />
                  <p className="text-foreground-muted font-medium">
                    Dra & släpp dina bilder
                  </p>
                  <p className="text-sm text-foreground-subtle mt-1">
                    eller klicka för att välja flera
                  </p>
                  <p className="text-xs text-foreground-subtle mt-4">
                    JPG, PNG, WebP — Max {MAX_DRAFTS} bilder
                  </p>
                </label>
              ) : (
                <div
                  onClick={handleImageClick}
                  className={`relative aspect-[3/4] rounded-2xl bg-background-secondary overflow-hidden select-none ${
                    previewMode ? "cursor-default" : "cursor-crosshair"
                  }`}
                  role={previewMode ? undefined : "button"}
                  aria-label={
                    previewMode
                      ? undefined
                      : "Klicka på bilden för att placera en tagg"
                  }
                >
                  <Image
                    src={active.previewUrl!}
                    alt="Förhandsvisning"
                    fill
                    className="object-cover pointer-events-none"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    unoptimized
                    draggable={false}
                  />

                  {!previewMode && active.tags.length === 0 && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pointer-events-none">
                      <p className="text-center text-sm font-medium text-white">
                        Klicka på ett plagg för att tagga det
                      </p>
                    </div>
                  )}

                  {active.tags.map((tag, i) => (
                    <div
                      key={tag.id}
                      className="absolute"
                      style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className={`relative ${
                          previewMode ? "" : "cursor-grab active:cursor-grabbing"
                        }`}
                        onPointerDown={
                          previewMode
                            ? undefined
                            : (e) => handleTagDragStart(e, tag.id)
                        }
                      >
                        <span className="absolute inset-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 animate-ping" />
                        <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                        <span className="absolute -translate-x-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-black/0">
                          {i + 1}
                        </span>
                        {!previewMode && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeTag(tag.id);
                            }}
                            className="absolute -top-3 -right-3 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600"
                            aria-label="Ta bort tagg"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <input
                id="image-input"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleInitialPick}
                className="sr-only"
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <PremiumButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // Replace just the active image
                    const replaceInput = document.createElement("input");
                    replaceInput.type = "file";
                    replaceInput.accept = "image/jpeg,image/png,image/webp";
                    replaceInput.onchange = (ev) => {
                      const f = (ev.target as HTMLInputElement).files?.[0];
                      if (f) replaceActiveImage(f);
                    };
                    replaceInput.click();
                  }}
                  disabled={!active.file}
                >
                  <Upload className="h-4 w-4" />
                  Byt bild
                </PremiumButton>
                <PremiumButton
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() => setPreviewMode((p) => !p)}
                  disabled={!active.file}
                >
                  <Eye className="h-4 w-4" />
                  {previewMode ? "Redigera" : "Förhandsvisa"}
                </PremiumButton>
              </div>
              {active.file && !previewMode && (
                <p className="mt-3 text-xs text-foreground-subtle">
                  Tips: dra prickarna för att flytta dem. {active.tags.length}{" "}
                  {active.tags.length === 1 ? "tagg" : "taggar"} placerad
                  {active.tags.length === 1 ? "" : "e"}.
                </p>
              )}
            </motion.div>

            {/* Form for active draft */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {active.status === "published" && active.published && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      Publicerad — {active.published.title}
                    </p>
                    <Link
                      href={active.published.url}
                      className="text-xs text-emerald-300 hover:underline"
                    >
                      Visa outfit →
                    </Link>
                  </div>
                </div>
              )}

              {active.status === "error" && active.error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.05] p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{active.error}</p>
                </div>
              )}

              <div>
                <label
                  htmlFor="title"
                  className="text-sm font-medium text-foreground-muted block mb-2"
                >
                  Titel
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={active.title}
                  onChange={(e) => updateActive({ title: e.target.value })}
                  placeholder="Ge din outfit ett namn..."
                  disabled={active.status === "published" || publishing}
                  className="w-full rounded-xl bg-background-secondary border border-border px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="text-sm font-medium text-foreground-muted block mb-2"
                >
                  Beskrivning
                </label>
                <textarea
                  id="description"
                  value={active.description}
                  onChange={(e) =>
                    updateActive({ description: e.target.value })
                  }
                  placeholder="Berätta om din outfit..."
                  rows={4}
                  disabled={active.status === "published" || publishing}
                  className="w-full rounded-xl bg-background-secondary border border-border px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors resize-none disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="text-sm font-medium text-foreground-muted block mb-2"
                >
                  Kategori
                </label>
                <select
                  id="category"
                  value={active.category}
                  onChange={(e) => updateActive({ category: e.target.value })}
                  disabled={active.status === "published" || publishing}
                  className="w-full rounded-xl bg-background-secondary border border-border px-4 py-3 text-foreground-subtle outline-none focus:border-white/30 transition-colors disabled:opacity-60"
                >
                  <option value="">Välj kategori...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground-muted block mb-2">
                  Taggade plagg ({active.tags.length})
                </label>
                {active.tags.length === 0 ? (
                  <p className="text-sm text-foreground-subtle">
                    Klicka direkt på bilden för att placera en tagg på det
                    plagget.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {active.tags.map((tag, i) => (
                      <div
                        key={tag.id}
                        className="rounded-xl border border-border bg-background-secondary p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">
                            Plagg {i + 1}
                          </p>
                          <IconButton
                            size="sm"
                            type="button"
                            onClick={() => removeTag(tag.id)}
                            aria-label="Ta bort"
                          >
                            <X className="h-4 w-4" />
                          </IconButton>
                        </div>
                        <select
                          value={tag.garment}
                          onChange={(e) =>
                            updateTag(tag.id, { garment: e.target.value })
                          }
                          className="w-full rounded-lg bg-background-tertiary border border-border px-3 py-2 text-sm text-white outline-none"
                        >
                          {GARMENTS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                        <BrandAutocomplete
                          brand={tag.brand}
                          onChangeBrand={(v) =>
                            updateTag(tag.id, { brand: v })
                          }
                          onPick={(product) =>
                            updateTag(tag.id, {
                              brand: product.brand,
                              name: product.name,
                              url: product.buyUrl,
                            })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Namn (t.ex. Air Force 1)"
                          value={tag.name}
                          onChange={(e) =>
                            updateTag(tag.id, { name: e.target.value })
                          }
                          className="w-full rounded-lg bg-background-tertiary border border-border px-3 py-2 text-sm text-white placeholder:text-foreground-subtle outline-none"
                        />
                        <input
                          type="url"
                          placeholder="Köplänk (URL)"
                          value={tag.url}
                          onChange={(e) =>
                            updateTag(tag.id, { url: e.target.value })
                          }
                          className="w-full rounded-lg bg-background-tertiary border border-border px-3 py-2 text-sm text-white placeholder:text-foreground-subtle outline-none"
                        />
                        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={tag.isAffiliate}
                            onChange={(e) =>
                              updateTag(tag.id, {
                                isAffiliate: e.target.checked,
                              })
                            }
                            className="mt-0.5 h-4 w-4 rounded border-border bg-background-tertiary accent-white"
                          />
                          <span className="text-xs text-foreground-muted leading-snug">
                            Affiliatelänk —{" "}
                            <span className="text-foreground-subtle">
                              kryssa i om du tjänar pengar när någon klickar.
                              Outfit märks då med &quot;Reklam&quot;.
                            </span>
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            updateTag(tag.id, { showRegions: !tag.showRegions })
                          }
                          className="text-[11px] uppercase tracking-wider text-foreground-subtle hover:text-white transition-colors text-left"
                        >
                          {tag.showRegions
                            ? "Dölj region-länkar"
                            : "+ Lägg till region-länkar"}
                        </button>
                        {tag.showRegions && (
                          <div className="space-y-2 pt-1 border-t border-border/60">
                            <p className="text-[11px] text-foreground-subtle">
                              Visa rätt butik per region. Lämna tomt för att
                              använda standardlänken.
                            </p>
                            {REGION_OPTIONS.map((r) => (
                              <div
                                key={r.code}
                                className="flex items-center gap-2"
                              >
                                <span className="w-12 shrink-0 text-[11px] uppercase tracking-wider text-foreground-muted">
                                  {r.code}
                                </span>
                                <input
                                  type="url"
                                  placeholder={`Länk för ${r.label}`}
                                  value={tag.regionUrls[r.code] ?? ""}
                                  onChange={(e) =>
                                    updateTag(tag.id, {
                                      regionUrls: {
                                        ...tag.regionUrls,
                                        [r.code]: e.target.value,
                                      },
                                    })
                                  }
                                  className="flex-1 rounded-lg bg-background-tertiary border border-border px-3 py-1.5 text-xs text-white placeholder:text-foreground-subtle outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <PremiumButton
                type="button"
                size="lg"
                className="w-full"
                disabled={!canPublish}
                onClick={handlePublishAll}
              >
                {publishing
                  ? `Publicerar ${
                      drafts.findIndex((d) => d.status === "publishing") + 1
                    } av ${drafts.length}…`
                  : pendingDrafts.length === 0
                    ? "Allt publicerat"
                    : `Publicera ${pendingDrafts.length} ${
                        pendingDrafts.length === 1 ? "outfit" : "outfits"
                      }`}
              </PremiumButton>

              {!canPublish &&
                pendingDrafts.length > 0 &&
                !publishing && (
                  <p className="text-xs text-foreground-subtle">
                    Varje bild behöver en titel innan du kan publicera.
                  </p>
                )}
            </motion.div>
          </div>

          <div className="py-16" />
        </Container>
      </main>
    </>
  );
}
