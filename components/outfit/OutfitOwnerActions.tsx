"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { setOutfitHidden, softDeleteOutfit } from "@/app/actions/user-content";

export function OutfitOwnerActions({
  outfitId,
  isHidden,
  isAdmin,
  editHref,
}: {
  outfitId: string;
  isHidden: boolean;
  isAdmin: boolean;
  /** Route to send the user to for full editing. Admin → /admin/inlagg/[id]. */
  editHref: string;
}) {
  const router = useRouter();
  const [hidden, setHidden] = useState(isHidden);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggleHide = () => {
    setError(null);
    const next = !hidden;
    startTransition(async () => {
      const res = await setOutfitHidden(outfitId, next);
      if (res.ok) {
        setHidden(next);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const remove = () => {
    if (
      !confirm(
        "Är du säker? Detta kan inte ångras.\n\nInlägget döljs direkt; admin kan återställa inom kort tid.",
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await softDeleteOutfit(outfitId);
      if (res.ok) {
        // Owner redirected away — the post is gone from their feed view.
        router.push("/profil");
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      {hidden && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold">
          Dold
        </span>
      )}

      <Link
        href={editHref}
        className="inline-flex items-center gap-1.5 rounded-full border border-border text-foreground-muted hover:text-white hover:border-white/30 px-3 py-1.5 text-xs"
      >
        <Edit className="h-3 w-3" />
        Redigera
      </Link>

      <button
        type="button"
        onClick={toggleHide}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border border-border text-foreground-muted hover:text-white hover:border-white/30 px-3 py-1.5 text-xs disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : hidden ? (
          <Eye className="h-3 w-3" />
        ) : (
          <EyeOff className="h-3 w-3" />
        )}
        {hidden ? "Visa igen" : "Dölj"}
      </button>

      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 px-3 py-1.5 text-xs disabled:opacity-60"
      >
        <Trash2 className="h-3 w-3" />
        Ta bort
      </button>

      {isAdmin && (
        <span className="ml-1 inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 text-[9px] uppercase tracking-wider">
          Admin
        </span>
      )}

      {error && (
        <span className="text-xs text-red-400 w-full" title={error}>
          {error.length > 80 ? error.slice(0, 80) + "…" : error}
        </span>
      )}
    </div>
  );
}
