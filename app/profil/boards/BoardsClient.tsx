"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Lock, Globe, X } from "lucide-react";
import { createBoard, type BoardActionResult } from "@/app/actions/boards";

export interface BoardSummary {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  outfitCount: number;
  coverImage: string | null;
}

const initialState: BoardActionResult = { ok: false };

export function BoardsClient({
  boards,
  migrationMissing,
}: {
  boards: BoardSummary[];
  migrationMissing: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <Link
        href="/profil"
        className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Tillbaka till profilen
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
            Samlingar
          </h1>
          <p className="mt-3 text-foreground-muted">
            Skapa kuraterade samlingar — publika eller privata.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium hover:bg-white/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ny samling
        </button>
      </div>

      {migrationMissing && (
        <p className="text-sm text-amber-400 mb-6">
          Tabellen finns inte ännu. Kör migration 0006_boards.sql i Supabase.
        </p>
      )}

      {boards.length === 0 && !migrationMissing && (
        <div className="rounded-2xl border border-border bg-background-secondary p-10 text-center">
          <p className="text-foreground-muted">
            Du har inga samlingar än.
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-4 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium hover:bg-white/90"
          >
            Skapa din första
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {boards.map((b) => (
          <Link
            key={b.id}
            href={`/board/${b.id}`}
            className="group rounded-2xl border border-border bg-background-secondary overflow-hidden hover:border-white/20 transition-colors"
          >
            <div className="relative aspect-[4/3] bg-background-tertiary">
              {b.coverImage ? (
                <Image
                  src={b.coverImage}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized={b.coverImage.startsWith("http")}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-foreground-subtle text-sm">
                  Tom samling
                </div>
              )}
              <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-wider text-white">
                {b.isPublic ? (
                  <>
                    <Globe className="h-3 w-3" /> Publik
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" /> Privat
                  </>
                )}
              </span>
            </div>
            <div className="p-4">
              <p className="font-medium text-white truncate">{b.name}</p>
              <p className="text-xs text-foreground-subtle mt-0.5">
                {b.outfitCount} {b.outfitCount === 1 ? "outfit" : "outfits"}
              </p>
              {b.description && (
                <p className="text-sm text-foreground-muted mt-2 line-clamp-2">
                  {b.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      <CreateBoardModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <div className="py-16" />
    </>
  );
}

function CreateBoardModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createBoard,
    initialState,
  );

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-background-secondary border border-white/10 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white">
                Ny samling
              </h2>
              <button
                onClick={onClose}
                aria-label="Stäng"
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={formAction} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground-muted block mb-2">
                  Namn
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  maxLength={80}
                  placeholder="T.ex. Sommar 2026"
                  className="w-full rounded-xl bg-background-tertiary border border-border px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30"
                />
                {state.fieldErrors?.name && (
                  <p className="mt-1 text-xs text-red-400">
                    {state.fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground-muted block mb-2">
                  Beskrivning (valfri)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  maxLength={500}
                  placeholder="Vad samlar du här?"
                  className="w-full rounded-xl bg-background-tertiary border border-border px-4 py-3 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 resize-none"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl bg-background-tertiary border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    Publik samling
                  </p>
                  <p className="text-xs text-foreground-subtle">
                    Andra kan se den. Avmarkera för privat.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_public"
                    defaultChecked
                    className="peer sr-only"
                  />
                  <span className="h-6 w-11 rounded-full bg-background-secondary border border-border peer-checked:bg-white peer-checked:border-white transition-colors" />
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-foreground-muted peer-checked:translate-x-5 peer-checked:bg-black transition-transform" />
                </label>
              </div>

              {state.error && (
                <p className="text-sm text-red-400">{state.error}</p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-white text-black py-3 text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {pending ? "Skapar…" : "Skapa samling"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
