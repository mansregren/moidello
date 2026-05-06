"use client";

import { Upload, Plus, Eye, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { IconButton } from "@/components/shared/IconButton";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface DemoTag {
  id: number;
  x: number;
  y: number;
  brand: string;
  name: string;
  url: string;
}

export default function SkapaPage() {
  const { requireAuth } = useAuth();
  const [tags, setTags] = useState<DemoTag[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  const addDemoTag = () => {
    setTags([
      ...tags,
      {
        id: Date.now(),
        x: 30 + Math.random() * 40,
        y: 30 + Math.random() * 40,
        brand: "",
        name: "",
        url: "",
      },
    ]);
  };

  const removeTag = (id: number) => {
    setTags(tags.filter((t) => t.id !== id));
  };

  const handlePublish = () => {
    requireAuth("create");
  };

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

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Image upload */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-border bg-background-secondary flex flex-col items-center justify-center cursor-pointer hover:border-white/30 transition-colors group">
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

                {tags.map((tag) => (
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
                          onClick={() => removeTag(tag.id)}
                          className="absolute -top-3 -right-3 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center"
                          aria-label="Ta bort tagg"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-3">
                <PremiumButton
                  variant="secondary"
                  size="sm"
                  onClick={addDemoTag}
                >
                  <Plus className="h-4 w-4" />
                  Lägg till tagg
                </PremiumButton>
                <PremiumButton
                  variant="glass"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
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
                <label className="text-sm font-medium text-foreground-muted block mb-2">
                  Titel
                </label>
                <input
                  type="text"
                  placeholder="Ge din outfit ett namn..."
                  className="w-full rounded-xl bg-background-secondary border border-border px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground-muted block mb-2">
                  Beskrivning
                </label>
                <textarea
                  placeholder="Berätta om din outfit..."
                  rows={4}
                  className="w-full rounded-xl bg-background-secondary border border-border px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground-muted block mb-2">
                  Kategori
                </label>
                <select className="w-full rounded-xl bg-background-secondary border border-border px-4 py-3 text-foreground-subtle outline-none focus:border-white/30 transition-colors">
                  <option>Välj kategori...</option>
                  <option>Streetwear</option>
                  <option>Minimalism</option>
                  <option>Vintage</option>
                  <option>Casual</option>
                  <option>Formal</option>
                  <option>Sporty</option>
                  <option>Bohemian</option>
                  <option>Preppy</option>
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
                            onClick={() => removeTag(tag.id)}
                            aria-label="Ta bort"
                          >
                            <X className="h-4 w-4" />
                          </IconButton>
                        </div>
                        <input
                          type="text"
                          placeholder="Märke (t.ex. Nike)"
                          className="w-full rounded-lg bg-background-tertiary border border-border px-3 py-2 text-sm text-white placeholder:text-foreground-subtle outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Namn (t.ex. Air Force 1)"
                          className="w-full rounded-lg bg-background-tertiary border border-border px-3 py-2 text-sm text-white placeholder:text-foreground-subtle outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Köplänk (URL)"
                          className="w-full rounded-lg bg-background-tertiary border border-border px-3 py-2 text-sm text-white placeholder:text-foreground-subtle outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <PremiumButton size="lg" className="w-full" onClick={handlePublish}>
                Publicera outfit
              </PremiumButton>
            </motion.div>
          </div>

          <div className="py-16" />
        </Container>
      </main>
    </>
  );
}
