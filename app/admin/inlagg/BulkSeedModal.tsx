"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Upload,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface SeedUser {
  id: string;
  username: string;
  display_name: string | null;
}

interface DraftSlot {
  file: File;
  previewUrl: string;
  userId: string;
  gender: "dam" | "herr";
  categoryHint: string;
}

const CATEGORIES = [
  { value: "", label: "AI gissar" },
  { value: "minimalism", label: "Minimalism" },
  { value: "streetwear", label: "Streetwear" },
  { value: "vintage", label: "Vintage" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "sporty", label: "Sporty" },
  { value: "preppy", label: "Preppy" },
];

const MAX_BATCH = 20;
const LAST_USER_KEY = "moidello_admin_last_seed_user";

const INPUT =
  "w-full rounded-xl bg-background-tertiary border border-border text-sm text-foreground p-2 outline-none focus:border-foreground/30";

export function BulkSeedModal({
  users,
  open,
  onClose,
}: {
  users: SeedUser[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [slots, setSlots] = useState<DraftSlot[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<{
    drafts: number;
    errors: { index: number; error: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default the user dropdown to the most recently used one.
  const defaultUserId = (): string => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LAST_USER_KEY);
      if (stored && users.some((u) => u.id === stored)) return stored;
    }
    return users[0]?.id ?? "";
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSlots((prev) => {
        prev.forEach((s) => URL.revokeObjectURL(s.previewUrl));
        return [];
      });
      setBusy(false);
      setProgress(null);
      setResult(null);
    }
  }, [open]);

  const addFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type),
    );
    const remaining = MAX_BATCH - slots.length;
    const toAdd = fileArray.slice(0, remaining);
    const userId = defaultUserId();
    const next: DraftSlot[] = toAdd.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      userId,
      gender: "dam",
      categoryHint: "",
    }));
    setSlots((prev) => [...prev, ...next]);
  };

  const removeSlot = (idx: number) => {
    setSlots((prev) => {
      const slot = prev[idx];
      if (slot) URL.revokeObjectURL(slot.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const updateSlot = (idx: number, patch: Partial<DraftSlot>) =>
    setSlots((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );

  const [distributeUsers, setDistributeUsers] = useState<Set<string>>(new Set());

  const distributeEvenly = () => {
    const ids = Array.from(distributeUsers);
    if (ids.length === 0 || slots.length === 0) return;
    setSlots((prev) =>
      prev.map((s, i) => ({ ...s, userId: ids[i % ids.length] })),
    );
  };

  const submit = async () => {
    if (slots.length === 0) return;
    setBusy(true);
    setProgress(`Skickar ${slots.length} bilder till Claude…`);
    setResult(null);

    const fd = new FormData();
    const assignments = slots.map((s) => ({
      user_id: s.userId,
      category_hint: s.categoryHint || null,
      gender: s.gender,
    }));
    fd.set("assignments", JSON.stringify(assignments));
    for (const s of slots) {
      fd.append("images", s.file);
    }

    // Remember last-used user for next time.
    const lastUser = slots[slots.length - 1]?.userId;
    if (lastUser) localStorage.setItem(LAST_USER_KEY, lastUser);

    try {
      const res = await fetch("/api/admin/posts/bulk-draft-from-images", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        drafts: Array<unknown>;
        errors: Array<{ index: number; error: string }>;
      };
      setResult({
        drafts: data.drafts.length,
        errors: data.errors,
      });
      setProgress(null);
      router.refresh();
    } catch (e) {
      setProgress(null);
      setResult({
        drafts: 0,
        errors: [
          {
            index: -1,
            error: e instanceof Error ? e.message : "Okänt fel.",
          },
        ],
      });
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 md:p-8">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-background-secondary shadow-xl">
        <div className="flex items-center justify-between gap-4 p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-foreground" />
            <h2 className="font-heading text-xl uppercase tracking-tight text-foreground">
              Skapa utkast från bilder
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-foreground-muted hover:text-foreground disabled:opacity-60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {result ? (
            <SeedResultPanel result={result} onClose={onClose} />
          ) : (
            <>
              <p className="text-sm text-foreground-muted">
                Dra in upp till {MAX_BATCH} bilder. Claude analyserar varje
                outfit och fyller i titel, meta-description, keywords,
                alt-text och kategori. Inläggen sparas som <strong>utkast</strong>{" "}
                kopplade till respektive användare — du publicerar sedan
                manuellt när du lagt på köplänkar.
              </p>

              {slots.length === 0 ? (
                <Dropzone
                  onFiles={addFiles}
                  onClick={() => fileInputRef.current?.click()}
                />
              ) : (
                <>
                  <DistributePanel
                    users={users}
                    selected={distributeUsers}
                    onToggle={(id) => {
                      setDistributeUsers((prev) => {
                        const next = new Set(prev);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      });
                    }}
                    onApply={distributeEvenly}
                    disabled={busy}
                  />

                  <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                    {slots.map((s, i) => (
                      <li
                        key={`${s.file.name}-${i}`}
                        className="rounded-xl border border-border bg-background-tertiary p-3 space-y-2"
                      >
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-background">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={s.previewUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeSlot(i)}
                            disabled={busy}
                            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-background/70 hover:bg-background text-foreground flex items-center justify-center disabled:opacity-60"
                            aria-label="Ta bort bild"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-background/70 text-foreground text-[10px] px-1.5 py-0.5">
                            #{i + 1}
                          </span>
                        </div>
                        <select
                          value={s.userId}
                          onChange={(e) =>
                            updateSlot(i, { userId: e.target.value })
                          }
                          disabled={busy}
                          className={INPUT}
                        >
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.display_name ?? u.username} (@{u.username})
                            </option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={s.gender}
                            onChange={(e) =>
                              updateSlot(i, {
                                gender: e.target.value as "dam" | "herr",
                              })
                            }
                            disabled={busy}
                            className={INPUT}
                          >
                            <option value="dam">Dam</option>
                            <option value="herr">Herr</option>
                          </select>
                          <select
                            value={s.categoryHint}
                            onChange={(e) =>
                              updateSlot(i, { categoryHint: e.target.value })
                            }
                            disabled={busy}
                            className={INPUT}
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={busy || slots.length >= MAX_BATCH}
                    className="inline-flex items-center gap-2 rounded-full border border-border text-foreground-muted hover:text-foreground hover:border-foreground/30 px-4 py-2 text-sm disabled:opacity-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Lägg till fler ({slots.length}/{MAX_BATCH})
                  </button>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
                className="sr-only"
              />

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                <p className="text-xs text-foreground-subtle">
                  {progress ?? `${slots.length} bilder valda`}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={busy}
                    className="rounded-full border border-border text-foreground-muted hover:text-foreground px-4 py-2 text-sm disabled:opacity-60"
                  >
                    Avbryt
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={busy || slots.length === 0}
                    className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generera {slots.length || ""}{" "}
                    {slots.length === 1 ? "utkast" : "utkast"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Dropzone({
  onFiles,
  onClick,
}: {
  onFiles: (files: FileList | File[]) => void;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        if (e.dataTransfer.files) onFiles(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-12 px-6 cursor-pointer transition-colors ${
        hover
          ? "border-foreground/50 bg-foreground/5"
          : "border-border hover:border-foreground/30"
      }`}
    >
      <Upload className="h-8 w-8 text-foreground-muted mb-3" />
      <p className="font-medium text-foreground">Dra in bilder eller klicka</p>
      <p className="mt-1 text-xs text-foreground-subtle">
        JPG, PNG, WebP — upp till {MAX_BATCH} st
      </p>
    </div>
  );
}

function DistributePanel({
  users,
  selected,
  onToggle,
  onApply,
  disabled,
}: {
  users: SeedUser[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onApply: () => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-background-tertiary p-3 space-y-2">
      <p className="text-xs text-foreground-muted">
        Markera användare nedan, tryck sedan <strong>Fördela jämnt</strong> så
        sätts dropdownarna i grid:en automatiskt.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onToggle(u.id)}
            disabled={disabled}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-60 ${
              selected.has(u.id)
                ? "bg-foreground text-background border-foreground"
                : "border-border text-foreground-muted hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {u.display_name ?? u.username}
          </button>
        ))}
        <button
          type="button"
          onClick={onApply}
          disabled={disabled || selected.size === 0}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-foreground/10 hover:bg-foreground/15 text-foreground px-3 py-1 text-xs font-semibold disabled:opacity-50"
        >
          Fördela jämnt ({selected.size})
        </button>
      </div>
    </div>
  );
}

function SeedResultPanel({
  result,
  onClose,
}: {
  result: { drafts: number; errors: { index: number; error: string }[] };
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {result.drafts > 0 ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-300" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-red-300" />
        )}
        <div>
          <p className="text-lg font-semibold text-foreground">
            {result.drafts} utkast skapade
          </p>
          <p className="text-xs text-foreground-muted">
            {result.errors.length > 0
              ? `${result.errors.length} misslyckades — se nedan`
              : "Klart. Filtrera på 'Utkast' i listan för att hitta dem."}
          </p>
        </div>
      </div>

      {result.errors.length > 0 && (
        <ul className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 space-y-1 text-xs text-red-200">
          {result.errors.map((e, i) => (
            <li key={i}>
              {e.index >= 0 ? `Bild #${e.index + 1}: ` : ""}
              {e.error}
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-foreground text-background px-5 py-2 text-sm font-semibold hover:bg-foreground/90"
        >
          Stäng
        </button>
      </div>
    </div>
  );
}
