"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderPlus, Plus, Check, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import {
  toggleOutfitOnBoard,
  createBoard,
  type BoardActionResult,
} from "@/app/actions/boards";

interface BoardListItem {
  id: string;
  name: string;
  isPublic: boolean;
  contains: boolean;
}

export function AddToBoardButton({ outfitId }: { outfitId: string }) {
  const { isLoggedIn, requireAuth, user } = useAuth();
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (!isLoggedIn) {
      requireAuth("save");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-full border border-border text-foreground px-4 py-2 text-sm hover:border-foreground/30 transition-colors"
      >
        <FolderPlus className="h-4 w-4" />
        Lägg i samling
      </button>
      {open && user && (
        <BoardSheet
          userId={user.id}
          outfitId={outfitId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function BoardSheet({
  userId,
  outfitId,
  onClose,
}: {
  userId: string;
  outfitId: string;
  onClose: () => void;
}) {
  const [boards, setBoards] = useState<BoardListItem[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const [{ data: boardRows }, { data: contains }] = await Promise.all([
        supabase
          .from("boards")
          .select("id, name, is_public")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("board_outfits")
          .select("board_id")
          .eq("outfit_id", outfitId),
      ]);
      if (cancelled) return;
      const containsSet = new Set(
        (contains ?? []).map((r) => r.board_id as string),
      );
      setBoards(
        (boardRows ?? []).map((b) => ({
          id: b.id as string,
          name: b.name as string,
          isPublic: b.is_public as boolean,
          contains: containsSet.has(b.id as string),
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, outfitId]);

  const toggle = (boardId: string) => {
    setPendingId(boardId);
    startTransition(async () => {
      const res = await toggleOutfitOnBoard(boardId, outfitId);
      if (res.ok) {
        setBoards(
          (prev) =>
            prev?.map((b) =>
              b.id === boardId ? { ...b, contains: res.added } : b,
            ) ?? null,
        );
      }
      setPendingId(null);
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md max-h-[80vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-background-secondary border border-foreground/10 p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground">
              Spara i samling
            </h2>
            <button
              onClick={onClose}
              aria-label="Stäng"
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCreating(true)}
            className="w-full mb-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-border bg-background-tertiary px-4 py-3 text-sm text-foreground hover:border-foreground/30"
          >
            <Plus className="h-4 w-4" />
            Skapa ny samling
          </button>

          {creating && (
            <CreateInline
              onCreated={(b) => {
                setBoards((prev) => [
                  { id: b.id, name: b.name, isPublic: b.isPublic, contains: false },
                  ...(prev ?? []),
                ]);
                setCreating(false);
              }}
              onCancel={() => setCreating(false)}
            />
          )}

          {!boards && (
            <p className="text-sm text-foreground-subtle py-6">Laddar samlingar…</p>
          )}

          {boards && boards.length === 0 && (
            <p className="text-sm text-foreground-muted py-2">
              Du har inga samlingar än. Skapa en för att börja kuratera.
            </p>
          )}

          <ul className="divide-y divide-border">
            {boards?.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => toggle(b.id)}
                  disabled={pendingId === b.id}
                  className="w-full flex items-center justify-between py-3 text-left disabled:opacity-60"
                >
                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      {b.name}
                    </span>
                    <span className="block text-xs text-foreground-subtle">
                      {b.isPublic ? "Publik" : "Privat"}
                    </span>
                  </span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                      b.contains
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-foreground-subtle"
                    }`}
                  >
                    {b.contains && <Check className="h-3.5 w-3.5" />}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const initial: BoardActionResult = { ok: false };

function CreateInline({
  onCreated,
  onCancel,
}: {
  onCreated: (b: { id: string; name: string; isPublic: boolean }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Skriv ett namn.");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", name.trim());
      if (isPublic) fd.set("is_public", "on");
      const res = await createBoard(initial, fd);
      if (res.ok && res.boardId) {
        onCreated({ id: res.boardId, name: name.trim(), isPublic });
      } else {
        setError(res.error ?? res.fieldErrors?.name ?? "Kunde inte skapa.");
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      className="mb-4 rounded-xl border border-border bg-background-tertiary p-4 space-y-3"
    >
      <input
        type="text"
        placeholder="Namn på samling"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        className="w-full rounded-lg bg-background-secondary border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30"
        autoFocus
      />
      <label className="flex items-center gap-2 text-xs text-foreground-muted">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 rounded border-border bg-background-secondary accent-white"
        />
        Publik
      </label>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-border text-foreground py-2 text-xs font-medium hover:border-foreground/30"
        >
          Avbryt
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-full bg-foreground text-background py-2 text-xs font-semibold disabled:opacity-60"
        >
          {pending ? "Skapar…" : "Skapa"}
        </button>
      </div>
    </form>
  );
}
