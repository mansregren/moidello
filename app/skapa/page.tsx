"use client";

import { Upload, Eye, X, CheckCircle2, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { IconButton } from "@/components/shared/IconButton";
import { motion } from "framer-motion";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useGender } from "@/lib/gender-context";
import { resizeImageForUpload } from "@/lib/image-resize";
import {
  createOutfit,
  type CreateOutfitState,
  type PublishedOutfit,
} from "./actions";

interface DemoTag {
  id: number;
  x: number;
  y: number;
  brand: string;
  name: string;
  url: string;
  garment: string;
  isAffiliate: boolean;
  /** Per-region overrides: ISO country code → URL. */
  regionUrls: Record<string, string>;
  showRegions: boolean;
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

const initialState: CreateOutfitState = {};

export default function SkapaPage() {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();
  const { gender } = useGender();
  const [tags, setTags] = useState<DemoTag[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [published, setPublished] = useState<PublishedOutfit[]>([]);
  const [lastHandledNonce, setLastHandledNonce] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction, pending] = useActionState(createOutfit, initialState);

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push("/login");
    }
  }, [loading, isLoggedIn, router]);

  // When a publish succeeds: add it to the session queue and reset the form
  // so the user can immediately upload the next outfit on the same page.
  // The nonce guards against re-applying the same success on re-renders.
  useEffect(() => {
    if (state.success && state.nonce && state.nonce !== lastHandledNonce) {
      setPublished((prev) => [...prev, state.success!]);
      setLastHandledNonce(state.nonce);
      setImageFile(null);
      setTags([]);
      setTitle("");
      setDescription("");
      setCategory("");
      setPreviewMode(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state, lastHandledNonce]);

  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  useEffect(() => {
    if (!imagePreview) return;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const addTagAt = (xPct: number, yPct: number) => {
    setTags((prev) => [
      ...prev,
      {
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
      },
    ]);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (previewMode || !imagePreview) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    // Clamp to leave a tiny safe-zone at the edges so dots aren't half-cut.
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
      updateTag(tagId, { x: clamp(xPct), y: clamp(yPct) });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const removeTag = (id: number) =>
    setTags((prev) => prev.filter((t) => t.id !== id));

  const updateTag = (id: number, patch: Partial<DemoTag>) =>
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      return;
    }
    try {
      const resized = await resizeImageForUpload(file);
      setImageFile(resized);
      // Sync the input's FileList so the form submits the resized file.
      if (fileInputRef.current && resized !== file) {
        const dt = new DataTransfer();
        dt.items.add(resized);
        fileInputRef.current.files = dt.files;
      }
    } catch {
      setImageFile(file);
    }
  };

  const tagsForSubmit = tags
    .filter((t) => t.brand.trim() && t.name.trim())
    .map((t) => {
      // Strip empty region URLs so we don't store {SE: ""} blobs
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

  if (loading || !isLoggedIn) {
    return (
      <>
        <Header />
        <main id="main" tabIndex={-1} className="flex-1" />
      </>
    );
  }

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
            <p className="text-foreground-muted mb-8">
              Dela din stil med världen. Publicera så många du vill —
              du stannar kvar på sidan tills du är klar.
            </p>
          </motion.div>

          {published.length > 0 && (
            <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    {published.length}{" "}
                    {published.length === 1 ? "outfit" : "outfits"}{" "}
                    publicerad{published.length === 1 ? "" : "e"} i den
                    här sessionen
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {published.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={p.url}
                          className="text-xs text-emerald-300 hover:underline"
                        >
                          {p.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <p className="text-xs text-foreground-muted inline-flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Fyll i formuläret nedan för att publicera nästa
                    </p>
                    {published[0]?.username && (
                      <Link
                        href={`/profile/${published[0].username}`}
                        className="text-xs text-white underline hover:text-white/80 ml-auto"
                      >
                        Klar — visa min profil →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <form action={formAction} className="grid lg:grid-cols-2 gap-8">
            <input type="hidden" name="gender" value={gender} />
            <input
              type="hidden"
              name="tags"
              value={JSON.stringify(tagsForSubmit)}
            />

            {/* File input — always present so the form can submit it.
                Hidden visually; the upload UI below triggers it. */}
            <input
              id="image-input"
              ref={fileInputRef}
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="sr-only"
              required
            />

            {/* Image upload + tag placement */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {!imagePreview ? (
                <label
                  htmlFor="image-input"
                  className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-border bg-background-secondary flex flex-col items-center justify-center cursor-pointer hover:border-white/30 transition-colors group overflow-hidden"
                >
                  <Upload className="h-12 w-12 text-foreground-subtle mb-4 group-hover:text-foreground-muted transition-colors" />
                  <p className="text-foreground-muted font-medium">
                    Dra & släpp din bild
                  </p>
                  <p className="text-sm text-foreground-subtle mt-1">
                    eller klicka för att välja
                  </p>
                  <p className="text-xs text-foreground-subtle mt-4">
                    JPG, PNG, WebP — Max 10MB
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
                    src={imagePreview}
                    alt="Förhandsvisning"
                    fill
                    className="object-cover pointer-events-none"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    unoptimized
                    draggable={false}
                  />

                  {!previewMode && tags.length === 0 && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pointer-events-none">
                      <p className="text-center text-sm font-medium text-white">
                        Klicka på ett plagg för att tagga det
                      </p>
                    </div>
                  )}

                  {tags.map((tag, i) => (
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

              <div className="mt-4 flex flex-wrap gap-3">
                <PremiumButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!imageFile}
                >
                  <Upload className="h-4 w-4" />
                  Byt bild
                </PremiumButton>
                <PremiumButton
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() => setPreviewMode((p) => !p)}
                  disabled={!imageFile}
                >
                  <Eye className="h-4 w-4" />
                  {previewMode ? "Redigera" : "Förhandsvisa"}
                </PremiumButton>
              </div>
              {imageFile && !previewMode && (
                <p className="mt-3 text-xs text-foreground-subtle">
                  Tips: dra prickarna för att flytta dem. {tags.length}{" "}
                  {tags.length === 1 ? "tagg" : "taggar"} placerad
                  {tags.length === 1 ? "" : "e"}.
                </p>
              )}
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="title"
                  className="text-sm font-medium text-foreground-muted block mb-2"
                >
                  Titel
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ge din outfit ett namn..."
                  className="w-full rounded-xl bg-background-secondary border border-border px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
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
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Berätta om din outfit..."
                  rows={4}
                  className="w-full rounded-xl bg-background-secondary border border-border px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors resize-none"
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
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl bg-background-secondary border border-border px-4 py-3 text-foreground-subtle outline-none focus:border-white/30 transition-colors"
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
                  Taggade plagg ({tags.length})
                </label>
                {tags.length === 0 ? (
                  <p className="text-sm text-foreground-subtle">
                    Klicka direkt på bilden för att placera en tagg på det
                    plagget.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tags.map((tag, i) => (
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
                        <input
                          type="text"
                          placeholder="Märke (t.ex. Nike)"
                          value={tag.brand}
                          onChange={(e) =>
                            updateTag(tag.id, { brand: e.target.value })
                          }
                          className="w-full rounded-lg bg-background-tertiary border border-border px-3 py-2 text-sm text-white placeholder:text-foreground-subtle outline-none"
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
                              updateTag(tag.id, { isAffiliate: e.target.checked })
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
                              <div key={r.code} className="flex items-center gap-2">
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

              {state.error && (
                <p className="text-sm text-red-400">{state.error}</p>
              )}

              <PremiumButton
                type="submit"
                size="lg"
                className="w-full"
                disabled={pending || !imageFile || !title}
              >
                {pending ? "Publicerar…" : "Publicera outfit"}
              </PremiumButton>
            </motion.div>
          </form>

          <div className="py-16" />
        </Container>
      </main>
    </>
  );
}
