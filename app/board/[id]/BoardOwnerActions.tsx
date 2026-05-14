"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, X } from "lucide-react";
import { deleteBoard, updateBoard } from "@/app/actions/boards";

export function BoardOwnerActions({
  boardId,
  name,
  description,
  isPublic,
}: {
  boardId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteBoard(boardId);
      if (res.ok) {
        router.push("/profil/boards");
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-border text-foreground px-4 py-2 text-sm hover:border-foreground/30 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Redigera
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="inline-flex items-center gap-2 rounded-full border border-border text-red-400 px-4 py-2 text-sm hover:border-red-400/30 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Radera
        </button>
      </div>

      <EditBoardModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        boardId={boardId}
        initialName={name}
        initialDescription={description ?? ""}
        initialPublic={isPublic}
      />

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-6"
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-background-secondary border border-foreground/10 p-6"
            >
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground">
                Radera samling?
              </h2>
              <p className="mt-3 text-sm text-foreground-muted">
                Detta tar bort samlingen permanent. Outfitsen tas inte bort —
                bara samlingen.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-full border border-border text-foreground py-3 text-sm font-medium hover:border-foreground/30"
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  className="flex-1 rounded-full bg-red-500 text-white py-3 text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
                >
                  {pending ? "Raderar…" : "Radera"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function EditBoardModal({
  open,
  onClose,
  boardId,
  initialName,
  initialDescription,
  initialPublic,
}: {
  open: boolean;
  onClose: () => void;
  boardId: string;
  initialName: string;
  initialDescription: string;
  initialPublic: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Skriv ett namn.");
      return;
    }
    startTransition(async () => {
      const res = await updateBoard(boardId, {
        name: name.trim(),
        description: description.trim() || null,
        isPublic,
      });
      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        setError(res.error ?? "Kunde inte spara.");
      }
    });
  };

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
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-background-secondary border border-foreground/10 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground">
                Redigera samling
              </h2>
              <button
                onClick={onClose}
                aria-label="Stäng"
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted hover:bg-foreground/5 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground-muted block mb-2">
                  Namn
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-background-tertiary border border-border px-4 py-3 text-foreground outline-none focus:border-foreground/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground-muted block mb-2">
                  Beskrivning
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl bg-background-tertiary border border-border px-4 py-3 text-foreground outline-none focus:border-foreground/30 resize-none"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-background-tertiary border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Publik samling
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="h-6 w-11 rounded-full bg-background-secondary border border-border peer-checked:bg-foreground peer-checked:border-foreground transition-colors" />
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-foreground-muted peer-checked:translate-x-5 peer-checked:bg-background transition-transform" />
                </label>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-foreground text-background py-3 text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {pending ? "Sparar…" : "Spara"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
