"use client";

import { Upload, Plus, Eye, X } from "lucide-react";
import Image from "next/image";
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
import { createOutfit, type CreateOutfitState } from "./actions";

interface DemoTag {
  id: number;
  x: number;
  y: number;
  brand: string;
  name: string;
  url: string;
  garment: string;
  isAffiliate: boolean;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction, pending] = useActionState(createOutfit, initialState);

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push("/login");
    }
  }, [loading, isLoggedIn, router]);

  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );

  useEffect(() => {
    if (!imagePreview) return;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const addTag = () => {
    setTags((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: 30 + Math.random() * 40,
        y: 30 + Math.random() * 40,
        brand: "",
        name: "",
        url: "",
        garment: "Toppar",
        isAffiliate: false,
      },
    ]);
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
    .map((t) => ({
      brand: t.brand,
      name: t.name,
      buyUrl: t.url,
      garment: t.garment,
      x: t.x,
      y: t.y,
      isAffiliate: t.isAffiliate,
    }));

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
              Dela din stil med världen
            </p>
          </motion.div>

          <form action={formAction} className="grid lg:grid-cols-2 gap-8">
            <input type="hidden" name="gender" value={gender} />
            <input
              type="hidden"
              name="tags"
              value={JSON.stringify(tagsForSubmit)}
            />

            {/* Image upload */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <label
                className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-border bg-background-secondary flex flex-col items-center justify-center cursor-pointer hover:border-white/30 transition-colors group overflow-hidden"
                htmlFor="image-input"
              >
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Förhandsvisning"
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    unoptimized
                  />
                ) : (
                  <>
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
                  </>
                )}

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

                {imagePreview &&
                  tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="absolute"
                      style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                    >
                      <div className="relative">
                        <span className="absolute inset-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 animate-ping" />
                        <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                        {!previewMode && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              removeTag(tag.id);
                            }}
                            className="absolute -top-3 -right-3 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center"
                            aria-label="Ta bort tagg"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </label>

              <div className="mt-4 flex gap-3">
                <PremiumButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addTag}
                  disabled={!imageFile}
                >
                  <Plus className="h-4 w-4" />
                  Lägg till tagg
                </PremiumButton>
                <PremiumButton
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() => setPreviewMode((p) => !p)}
                >
                  <Eye className="h-4 w-4" />
                  {previewMode ? "Redigera" : "Förhandsvisa"}
                </PremiumButton>
              </div>
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
                    Klicka &quot;Lägg till tagg&quot; och placera den på bilden
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
