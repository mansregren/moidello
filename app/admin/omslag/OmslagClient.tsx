"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { setCategoryCover } from "@/app/actions/admin-content";

export interface CoverCandidate {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  vertical: "mode" | "hem";
  isCover: boolean;
}

type Group = {
  key: string;
  vertical: "mode" | "hem";
  category: string;
  items: CoverCandidate[];
};

export function OmslagClient({ rows }: { rows: CoverCandidate[] }) {
  const [covers, setCovers] = useState<Record<string, string | null>>(() => {
    // Map of group key → chosen outfit id (or null).
    const m: Record<string, string | null> = {};
    for (const r of rows) {
      const key = `${r.vertical}::${r.category}`;
      if (r.isCover) m[key] = r.id;
      else if (!(key in m)) m[key] = m[key] ?? null;
    }
    return m;
  });
  const [pending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const r of rows) {
      const key = `${r.vertical}::${r.category}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          vertical: r.vertical,
          category: r.category,
          items: [],
        });
      }
      map.get(key)!.items.push(r);
    }
    // Sort: hem first, then by category name.
    return Array.from(map.values()).sort((a, b) =>
      a.vertical === b.vertical
        ? a.category.localeCompare(b.category, "sv")
        : a.vertical === "hem"
          ? -1
          : 1,
    );
  }, [rows]);

  const choose = (group: Group, outfitId: string | null) => {
    setBusyKey(group.key);
    setCovers((prev) => ({ ...prev, [group.key]: outfitId }));
    startTransition(async () => {
      const res = await setCategoryCover(
        outfitId,
        group.vertical,
        group.category,
      );
      if (!res.ok) {
        // Revert on failure.
        setCovers((prev) => ({ ...prev, [group.key]: prev[group.key] }));
      }
      setBusyKey(null);
    });
  };

  return (
    <div className="space-y-10">
      {groups.map((group) => {
        const chosen = covers[group.key] ?? null;
        return (
          <section key={group.key}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                {group.category}
                <span className="ml-2 text-[11px] uppercase tracking-wider text-foreground-subtle">
                  {group.vertical === "hem" ? "Hem" : "Mode"}
                </span>
              </h2>
              {chosen && (
                <button
                  type="button"
                  onClick={() => choose(group, null)}
                  disabled={pending && busyKey === group.key}
                  className="text-[11px] text-foreground-subtle hover:text-foreground transition-colors disabled:opacity-60"
                >
                  Återställ (nyaste)
                </button>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {group.items.map((it) => {
                const active = chosen === it.id;
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => choose(group, it.id)}
                    disabled={pending && busyKey === group.key}
                    title={it.title}
                    className={`relative h-32 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all disabled:opacity-60 ${
                      active
                        ? "border-foreground ring-2 ring-foreground/40"
                        : "border-transparent hover:border-foreground/30"
                    }`}
                  >
                    <Image
                      src={it.imageUrl}
                      alt={it.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                      unoptimized={it.imageUrl.startsWith("http")}
                    />
                    {active && (
                      <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      {groups.length === 0 && (
        <p className="text-foreground-muted">
          Inga publicerade inlägg med kategori ännu.
        </p>
      )}
    </div>
  );
}
