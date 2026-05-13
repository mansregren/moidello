"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateOutfit } from "@/app/actions/admin-content";

export function PublishToggle({
  outfitId,
  initialPublished,
}: {
  outfitId: string;
  initialPublished: boolean;
}) {
  const router = useRouter();
  const [published, setPublished] = useState(initialPublished);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    const next = !published;
    startTransition(async () => {
      const res = await updateOutfit(outfitId, { is_published: next });
      if (res.ok) {
        setPublished(next);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      title={published ? "Avpublicera" : "Publicera"}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
        published
          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
          : "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
      }`}
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : published ? (
        <Eye className="h-3 w-3" />
      ) : (
        <EyeOff className="h-3 w-3" />
      )}
      {published ? "Publicerad" : "Utkast"}
      {error && (
        <span className="ml-1 text-[10px] text-red-400" title={error}>
          fel
        </span>
      )}
    </button>
  );
}
