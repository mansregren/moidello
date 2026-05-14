"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Square, Eye, EyeOff, Trash2, UserCog, Loader2 } from "lucide-react";
import {
  bulkPublishOutfits,
  bulkDeleteOutfits,
  bulkReassignOutfits,
} from "@/app/actions/admin-content";

interface SeedUser {
  id: string;
  username: string;
  display_name: string | null;
}

interface SelectionCtxValue {
  selected: Set<string>;
  toggle: (id: string) => void;
  clear: () => void;
  selectAll: (ids: string[]) => void;
}

const SelectionCtx = createContext<SelectionCtxValue | null>(null);

export function SelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const clear = () => setSelected(new Set());

  const selectAll = (ids: string[]) =>
    setSelected((prev) => {
      // If every id is already selected, clear; otherwise add all.
      const allIn = ids.every((i) => prev.has(i));
      if (allIn) return new Set();
      return new Set(ids);
    });

  return (
    <SelectionCtx.Provider value={{ selected, toggle, clear, selectAll }}>
      {children}
    </SelectionCtx.Provider>
  );
}

export function useSelection(): SelectionCtxValue {
  const ctx = useContext(SelectionCtx);
  if (!ctx) throw new Error("useSelection must be inside SelectionProvider");
  return ctx;
}

export function SelectCheckbox({ outfitId }: { outfitId: string }) {
  const { selected, toggle } = useSelection();
  const isSelected = selected.has(outfitId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(outfitId);
      }}
      className={`shrink-0 inline-flex items-center justify-center h-6 w-6 rounded transition-colors ${
        isSelected
          ? "bg-foreground text-background"
          : "border border-border text-foreground-muted hover:text-foreground hover:border-foreground/30"
      }`}
      aria-label={isSelected ? "Avmarkera" : "Markera"}
    >
      {isSelected ? (
        <CheckSquare className="h-3.5 w-3.5" />
      ) : (
        <Square className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function SelectAllToggle({ ids }: { ids: string[] }) {
  const { selected, selectAll } = useSelection();
  const allIn = ids.length > 0 && ids.every((i) => selected.has(i));
  return (
    <button
      type="button"
      onClick={() => selectAll(ids)}
      className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground"
    >
      {allIn ? (
        <CheckSquare className="h-3.5 w-3.5" />
      ) : (
        <Square className="h-3.5 w-3.5" />
      )}
      {allIn ? "Avmarkera alla" : "Markera alla"}
    </button>
  );
}

export function BulkActionBar({ users }: { users: SeedUser[] }) {
  const router = useRouter();
  const { selected, clear } = useSelection();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showReassign, setShowReassign] = useState(false);
  const [reassignTo, setReassignTo] = useState("");

  if (selected.size === 0) return null;

  const ids = Array.from(selected);

  const publish = (next: boolean) => {
    setError(null);
    startTransition(async () => {
      const res = await bulkPublishOutfits(ids, next);
      if (!res.ok) setError(res.error);
      else {
        clear();
        router.refresh();
      }
    });
  };

  const remove = () => {
    if (
      !confirm(
        `Radera ${ids.length} inlägg permanent? Alla taggar, kommentarer och klick raderas också.`,
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await bulkDeleteOutfits(ids);
      if (!res.ok) setError(res.error);
      else {
        clear();
        router.refresh();
      }
    });
  };

  const reassign = () => {
    if (!reassignTo) return;
    setError(null);
    startTransition(async () => {
      const res = await bulkReassignOutfits(ids, reassignTo);
      if (!res.ok) setError(res.error);
      else {
        clear();
        setShowReassign(false);
        setReassignTo("");
        router.refresh();
      }
    });
  };

  return (
    <div className="sticky top-2 z-30 rounded-2xl border border-foreground/30 bg-background-secondary/95 backdrop-blur-sm p-3 shadow-xl mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">
          {selected.size} markerade
        </span>
        <button
          type="button"
          onClick={clear}
          disabled={pending}
          className="text-xs text-foreground-muted hover:text-foreground"
        >
          rensa
        </button>
        <span className="text-foreground-subtle">·</span>

        <button
          type="button"
          onClick={() => publish(true)}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
          Publicera
        </button>
        <button
          type="button"
          onClick={() => publish(false)}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
        >
          <EyeOff className="h-3 w-3" />
          Avpublicera
        </button>
        <button
          type="button"
          onClick={() => setShowReassign((s) => !s)}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
        >
          <UserCog className="h-3 w-3" />
          Tilldela om
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ml-auto"
        >
          <Trash2 className="h-3 w-3" />
          Radera
        </button>
      </div>

      {showReassign && (
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-border">
          <span className="text-xs text-foreground-muted">Tilldela till:</span>
          <select
            value={reassignTo}
            onChange={(e) => setReassignTo(e.target.value)}
            disabled={pending}
            className="rounded-xl bg-background-tertiary border border-border text-sm text-foreground p-2 outline-none focus:border-foreground/30"
          >
            <option value="">— välj —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.display_name ?? u.username} (@{u.username})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={reassign}
            disabled={pending || !reassignTo}
            className="rounded-full bg-blue-500 hover:bg-blue-400 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
          >
            Genomför
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
