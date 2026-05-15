"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PenLine,
  Upload,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface SeedUser {
  id: string;
  username: string;
  display_name: string | null;
}

interface ManualRow {
  id: string;
  file: File;
  previewUrl: string;
  userId: string;
  gender: "dam" | "herr";
  category: string;
  title: string;
  description: string;
  keywords: string[];
}

const CATEGORIES = [
  { value: "", label: "— välj —" },
  { value: "streetwear", label: "Streetwear" },
  { value: "minimalism", label: "Minimalism" },
  { value: "vintage", label: "Vintage" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "sporty", label: "Sporty" },
  { value: "preppy", label: "Preppy" },
];

const MAX_BATCH = 20;
const LAST_USER_KEY = "moidello_admin_last_seed_user";
const LAST_CATEGORY_KEY = "moidello_admin_last_manual_category";
const LAST_GENDER_KEY = "moidello_admin_last_manual_gender";
const LAST_DISTRIBUTE_KEY = "moidello_admin_last_distribute_users";

const INPUT =
  "w-full rounded-xl bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-subtle p-2 outline-none focus:border-foreground/30";

function newRowId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function rowIsReady(r: ManualRow): boolean {
  return !!r.title.trim() && !!r.userId && !!r.gender;
}

export function BulkManualModal({
  users,
  open,
  onClose,
}: {
  users: SeedUser[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<ManualRow[]>([]);
  const [titlePrefix, setTitlePrefix] = useState("");
  const [distributeUsers, setDistributeUsers] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(LAST_DISTRIBUTE_KEY);
      if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch {}
    return new Set();
  });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<{
    drafts: number;
    errors: { index: number; error: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaults = () => ({
    userId:
      (typeof window !== "undefined" &&
        localStorage.getItem(LAST_USER_KEY)) ||
      users[0]?.id ||
      "",
    category:
      (typeof window !== "undefined" &&
        localStorage.getItem(LAST_CATEGORY_KEY)) ||
      "",
    gender:
      ((typeof window !== "undefined" &&
        localStorage.getItem(LAST_GENDER_KEY)) as "dam" | "herr") || "dam",
  });

  // Persist defaults whenever rows update
  useEffect(() => {
    if (rows.length === 0) return;
    const last = rows[rows.length - 1];
    if (last) {
      try {
        localStorage.setItem(LAST_USER_KEY, last.userId);
        localStorage.setItem(LAST_CATEGORY_KEY, last.category);
        localStorage.setItem(LAST_GENDER_KEY, last.gender);
      } catch {}
    }
  }, [rows]);

  useEffect(() => {
    try {
      localStorage.setItem(
        LAST_DISTRIBUTE_KEY,
        JSON.stringify(Array.from(distributeUsers)),
      );
    } catch {}
  }, [distributeUsers]);

  useEffect(() => {
    if (!open) {
      setRows((prev) => {
        prev.forEach((r) => URL.revokeObjectURL(r.previewUrl));
        return [];
      });
      setBusy(false);
      setProgress(null);
      setResult(null);
      setTitlePrefix("");
    }
  }, [open]);

  // Cmd/Ctrl+Enter submits
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !busy) {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, busy, rows]);

  const addFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type),
    );
    const remaining = MAX_BATCH - rows.length;
    const d = defaults();
    const next: ManualRow[] = fileArray.slice(0, remaining).map((f) => ({
      id: newRowId(),
      file: f,
      previewUrl: URL.createObjectURL(f),
      userId: d.userId,
      gender: d.gender,
      category: d.category,
      title: "",
      description: "",
      keywords: [],
    }));
    setRows((prev) => [...prev, ...next]);
  };

  const updateRow = (id: string, patch: Partial<ManualRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRow = (id: string) =>
    setRows((prev) => {
      const r = prev.find((x) => x.id === id);
      if (r) URL.revokeObjectURL(r.previewUrl);
      return prev.filter((x) => x.id !== id);
    });

  const distributeEvenly = () => {
    const ids = Array.from(distributeUsers);
    if (ids.length === 0 || rows.length === 0) return;
    setRows((prev) =>
      prev.map((r, i) => ({ ...r, userId: ids[i % ids.length] })),
    );
  };

  const applyCategoryToAll = (cat: string) => {
    setRows((prev) => prev.map((r) => ({ ...r, category: cat })));
  };

  const applyPrefix = () => {
    const p = titlePrefix.trim();
    if (!p) return;
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        title: r.title.startsWith(p) ? r.title : `${p} ${r.title}`.trim(),
      })),
    );
  };

  const readyCount = rows.filter(rowIsReady).length;

  const submit = async () => {
    const readyRows = rows.filter(rowIsReady);
    if (readyRows.length === 0) return;
    setBusy(true);
    setProgress(`Skapar ${readyRows.length} utkast…`);
    setResult(null);

    const fd = new FormData();
    const assignments = readyRows.map((r) => ({
      user_id: r.userId,
      gender: r.gender,
      category: r.category || null,
      title: r.title,
      description: r.description || null,
      keywords: r.keywords.length > 0 ? r.keywords : undefined,
      ai_generate_missing: false,
    }));
    fd.set("assignments", JSON.stringify(assignments));
    for (const r of readyRows) {
      fd.append("images", r.file);
    }

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
      setResult({ drafts: data.drafts.length, errors: data.errors });
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
      <div className="w-full max-w-5xl rounded-2xl border border-border bg-background-secondary shadow-xl">
        <div className="flex items-center justify-between gap-4 p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <PenLine className="h-4 w-4 text-foreground" />
            <h2 className="font-heading text-xl uppercase tracking-tight text-foreground">
              Skapa manuellt
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
            <ResultPanel result={result} onClose={onClose} />
          ) : (
            <>
              <p className="text-sm text-foreground-muted">
                Dra in bilder, skriv titel + välj användare per bild, klicka{" "}
                <strong>Skapa N utkast</strong>. Ingen AI — du har full
                kontroll över texten.
              </p>

              {rows.length === 0 ? (
                <Dropzone
                  onFiles={addFiles}
                  onClick={() => fileInputRef.current?.click()}
                />
              ) : (
                <>
                  {/* Bulk-actions */}
                  <div className="rounded-xl border border-border bg-background-tertiary p-3 space-y-3">
                    <div>
                      <p className="text-xs text-foreground-muted mb-2">
                        Markera användare → tryck Fördela jämnt.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {users.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() =>
                              setDistributeUsers((prev) => {
                                const next = new Set(prev);
                                if (next.has(u.id)) next.delete(u.id);
                                else next.add(u.id);
                                return next;
                              })
                            }
                            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                              distributeUsers.has(u.id)
                                ? "bg-foreground text-background border-foreground"
                                : "border-border text-foreground-muted hover:text-foreground hover:border-foreground/30"
                            }`}
                          >
                            {u.display_name ?? u.username}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={distributeEvenly}
                          disabled={distributeUsers.size === 0}
                          className="ml-auto inline-flex rounded-full bg-foreground/10 hover:bg-foreground/15 text-foreground px-3 py-1 text-xs font-semibold disabled:opacity-50"
                        >
                          Fördela jämnt ({distributeUsers.size})
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-foreground-muted">
                        Kategori för alla:
                      </span>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) applyCategoryToAll(e.target.value);
                          e.target.value = "";
                        }}
                        className="rounded-full bg-background-secondary border border-border text-foreground-muted text-xs px-2 py-1 outline-none cursor-pointer"
                      >
                        <option value="">— välj —</option>
                        {CATEGORIES.filter((c) => c.value).map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>

                      <span className="text-xs text-foreground-muted ml-3">
                        Titel-prefix:
                      </span>
                      <input
                        type="text"
                        value={titlePrefix}
                        onChange={(e) => setTitlePrefix(e.target.value)}
                        placeholder="ex: Sommar 2026"
                        className="rounded-full bg-background-secondary border border-border text-foreground text-xs px-3 py-1 outline-none focus:border-foreground/30"
                      />
                      <button
                        type="button"
                        onClick={applyPrefix}
                        disabled={!titlePrefix.trim()}
                        className="rounded-full bg-foreground/10 hover:bg-foreground/15 text-foreground px-3 py-1 text-xs font-semibold disabled:opacity-50"
                      >
                        Applicera
                      </button>
                    </div>
                  </div>

                  {/* Rows */}
                  <ul className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                    {rows.map((r, idx) => (
                      <li
                        key={r.id}
                        className="rounded-xl border border-border bg-background-tertiary p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative h-24 w-20 shrink-0 rounded-lg overflow-hidden bg-background">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={r.previewUrl}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                            <span className="absolute top-1 left-1 rounded-full bg-background/70 text-foreground text-[9px] px-1.5 py-0.5">
                              #{idx + 1}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <StatusBadge ready={rowIsReady(r)} />
                              <button
                                type="button"
                                onClick={() => removeRow(r.id)}
                                disabled={busy}
                                className="inline-flex items-center justify-center h-6 w-6 rounded-full text-foreground-muted hover:bg-red-500/15 hover:text-red-300"
                                aria-label="Ta bort"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>

                            <input
                              type="text"
                              placeholder="Titel (krävs) — Linen Set & Espadrilles"
                              value={r.title}
                              onChange={(e) =>
                                updateRow(r.id, { title: e.target.value })
                              }
                              disabled={busy}
                              className={INPUT}
                            />

                            <div className="grid grid-cols-3 gap-2">
                              <select
                                value={r.userId}
                                onChange={(e) =>
                                  updateRow(r.id, { userId: e.target.value })
                                }
                                disabled={busy}
                                className={INPUT}
                              >
                                <option value="">— användare —</option>
                                {users.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.display_name ?? u.username}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={r.gender}
                                onChange={(e) =>
                                  updateRow(r.id, {
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
                                value={r.category}
                                onChange={(e) =>
                                  updateRow(r.id, { category: e.target.value })
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

                            <textarea
                              value={r.description}
                              onChange={(e) =>
                                updateRow(r.id, { description: e.target.value })
                              }
                              disabled={busy}
                              placeholder="Beskrivning (frivillig) — 1-2 meningar"
                              rows={2}
                              maxLength={2000}
                              className={`${INPUT} resize-none`}
                            />

                            <KeywordsInput
                              value={r.keywords}
                              onChange={(kw) =>
                                updateRow(r.id, { keywords: kw })
                              }
                              disabled={busy}
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={busy || rows.length >= MAX_BATCH}
                    className="inline-flex items-center gap-2 rounded-full border border-border text-foreground-muted hover:text-foreground hover:border-foreground/30 px-4 py-2 text-sm disabled:opacity-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Lägg till fler ({rows.length}/{MAX_BATCH})
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
                  {progress ??
                    (rows.length > 0
                      ? `${readyCount} av ${rows.length} redo att skapa`
                      : "Inga bilder valda")}
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
                    disabled={busy || readyCount === 0}
                    title="Cmd/Ctrl+Enter"
                    className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PenLine className="h-4 w-4" />
                    )}
                    Skapa {readyCount > 0 ? readyCount : ""} utkast
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

function StatusBadge({ ready }: { ready: boolean }) {
  if (ready) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 text-[10px]">
        <CheckCircle2 className="h-3 w-3" />
        Klar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 text-[10px]">
      <Circle className="h-3 w-3" />
      Behöver titel + user + gender
    </span>
  );
}

function KeywordsInput({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled: boolean;
}) {
  const add = (k: string) => {
    const cleaned = k.trim().toLowerCase();
    if (!cleaned || value.includes(cleaned) || value.length >= 8) return;
    onChange([...value, cleaned]);
  };
  const remove = (k: string) => onChange(value.filter((x) => x !== k));
  return (
    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-background border border-border min-h-[36px]">
      {value.map((k) => (
        <span
          key={k}
          className="inline-flex items-center gap-1 rounded-full bg-foreground/10 text-foreground px-2 py-0.5 text-xs"
        >
          {k}
          <button
            type="button"
            onClick={() => remove(k)}
            className="text-foreground/60 hover:text-foreground"
            disabled={disabled}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        placeholder={value.length >= 8 ? "Max 8" : "Keywords + Enter (frivilligt)"}
        disabled={disabled || value.length >= 8}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const v = (e.target as HTMLInputElement).value;
            add(v);
            (e.target as HTMLInputElement).value = "";
          }
        }}
        onBlur={(e) => {
          if (e.target.value.trim()) {
            add(e.target.value);
            e.target.value = "";
          }
        }}
        className="flex-1 min-w-[120px] bg-transparent text-xs text-foreground placeholder:text-foreground-subtle outline-none"
      />
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

function ResultPanel({
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
              : "Klart. Filtrera på 'Utkast' i listan."}
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
      <div className="flex justify-end pt-2 border-t border-border">
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
