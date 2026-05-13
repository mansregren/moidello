"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { updateOutfit, deleteOutfit } from "@/app/actions/admin-content";
import { outfitPathFromParts } from "@/lib/outfit-url";

export interface AdminOutfitCardItem {
  id: string;
  slug: string | null;
  title: string;
  image_url: string;
  is_published: boolean;
  created_at: string;
}

export function OutfitAdminCard({
  outfit,
  username,
}: {
  outfit: AdminOutfitCardItem;
  username: string;
}) {
  const router = useRouter();
  const [published, setPublished] = useState(outfit.is_published);
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (removed) return null;

  const togglePublish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    const next = !published;
    startTransition(async () => {
      const res = await updateOutfit(outfit.id, { is_published: next });
      if (res.ok) {
        setPublished(next);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        `Radera "${outfit.title}" permanent? Alla taggar, kommentarer, gilla- och köp-klick raderas också.`,
      )
    )
      return;
    setError(null);
    setDeleting(true);
    startTransition(async () => {
      const res = await deleteOutfit(outfit.id);
      setDeleting(false);
      if (res.ok) {
        setRemoved(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="group relative block">
      <Link href={`/admin/inlagg/${outfit.id}`}>
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-background-tertiary">
          <Image
            src={outfit.image_url}
            alt={outfit.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            unoptimized={outfit.image_url.startsWith("http")}
          />
          {!published && (
            <span className="absolute top-2 left-2 inline-flex rounded-full bg-amber-500/90 text-black px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold pointer-events-none">
              Utkast
            </span>
          )}

          {/* Action overlay — visible always so admins don't need to hover */}
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={togglePublish}
              disabled={pending || deleting}
              title={published ? "Avpublicera" : "Publicera"}
              className={`inline-flex items-center justify-center h-8 w-8 rounded-full backdrop-blur-sm transition-colors disabled:opacity-60 ${
                published
                  ? "bg-emerald-500/85 hover:bg-emerald-500 text-black"
                  : "bg-amber-400/90 hover:bg-amber-400 text-black"
              }`}
            >
              {pending && !deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : published ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending || deleting}
              title="Radera inlägg permanent"
              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-500/85 hover:bg-red-500 text-white backdrop-blur-sm transition-colors disabled:opacity-60"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-white truncate">{outfit.title}</p>
      </Link>
      <p className="text-xs text-foreground-subtle">
        {new Date(outfit.created_at).toLocaleDateString("sv-SE")}
        {" · "}
        <Link
          href={outfitPathFromParts(username, outfit.slug, outfit.id)}
          target="_blank"
          className="hover:text-white"
        >
          publik →
        </Link>
      </p>
      {error && (
        <p className="mt-1 text-xs text-red-400" title={error}>
          {error.length > 60 ? error.slice(0, 60) + "…" : error}
        </p>
      )}
    </div>
  );
}
