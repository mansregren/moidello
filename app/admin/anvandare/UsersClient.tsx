"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Shield,
  ShieldOff,
  Trash2,
  UserCheck,
  Search,
  Sparkles,
  ExternalLink,
  Pencil,
  Plus,
  X,
  Upload,
} from "lucide-react";
import { useRef } from "react";
import Image from "next/image";
import { UserAvatar } from "@/components/user/UserAvatar";
import {
  startImpersonation,
  toggleAdmin,
  deleteUserAccount,
  seedDummyCreators,
  updateUserProfile,
  createDummyCreator,
  uploadUserAvatar,
} from "@/app/actions/admin-users";

export interface UserRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  account_type: "creator" | "brand" | null;
  brand_name: string | null;
  is_admin: boolean;
  is_demo?: boolean;
  created_at: string;
}

export function UsersClient({
  users,
  outfitCounts,
  viewerId,
  initialQuery,
  currentFilter: _currentFilter,
}: {
  users: UserRow[];
  outfitCounts: Record<string, number>;
  viewerId: string | null;
  initialQuery: string;
  currentFilter?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [topError, setTopError] = useState<string | null>(null);
  const [seedReport, setSeedReport] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [, startTransition] = useTransition();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (_currentFilter && _currentFilter !== "all")
      params.set("filter", _currentFilter);
    const qs = params.toString();
    router.push(`/admin/anvandare${qs ? "?" + qs : ""}`);
  };

  const handleImpersonate = (uid: string) => {
    setTopError(null);
    setBusyId(uid);
    startTransition(async () => {
      const res = await startImpersonation(uid);
      setBusyId(null);
      if (!res.ok) {
        setTopError(res.error);
        return;
      }
      router.push("/skapa");
    });
  };

  const handleToggleAdmin = (uid: string) => {
    setTopError(null);
    setBusyId(uid);
    startTransition(async () => {
      const res = await toggleAdmin(uid);
      setBusyId(null);
      if (!res.ok) setTopError(res.error);
      else router.refresh();
    });
  };

  const handleDelete = (uid: string, label: string) => {
    if (
      !confirm(
        `Radera ${label} permanent? All deras outfits, kommentarer och meddelanden raderas också.`,
      )
    )
      return;
    setTopError(null);
    setBusyId(uid);
    startTransition(async () => {
      const res = await deleteUserAccount(uid);
      setBusyId(null);
      if (!res.ok) setTopError(res.error);
      else router.refresh();
    });
  };

  const handleSeed = () => {
    setTopError(null);
    setSeedReport(null);
    startTransition(async () => {
      const res = await seedDummyCreators();
      const parts: string[] = [];
      if (res.created > 0) parts.push(`${res.created} skapade`);
      if (res.skipped > 0) parts.push(`${res.skipped} fanns redan`);
      if (res.errors.length > 0)
        parts.push(`${res.errors.length} fel: ${res.errors.join("; ")}`);
      setSeedReport(parts.join(" · ") || "Inget hände.");
      router.refresh();
    });
  };

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <form onSubmit={submitSearch} className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök användarnamn, namn eller märke…"
              className="w-full rounded-full bg-background-secondary border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle outline-none focus:border-foreground/30"
            />
          </div>
        </form>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:bg-foreground/90"
        >
          <Plus className="h-4 w-4" />
          Ny användare
        </button>
        <button
          type="button"
          onClick={handleSeed}
          className="inline-flex items-center gap-2 rounded-full border border-border text-foreground px-4 py-2.5 text-sm font-semibold hover:border-foreground/30"
        >
          <Sparkles className="h-4 w-4" />
          Seed 8 demo
        </button>
      </div>

      {topError && (
        <p className="mt-4 text-xs text-red-400">{topError}</p>
      )}
      {seedReport && (
        <p className="mt-4 text-xs text-foreground-muted">{seedReport}</p>
      )}

      <ul className="mt-8 space-y-2">
        {users.length === 0 && (
          <p className="text-sm text-foreground-subtle">
            Inga användare matchar.
          </p>
        )}
        {users.map((u) => {
          const isViewer = u.id === viewerId;
          const isBusy = busyId === u.id;
          const count = outfitCounts[u.id] ?? 0;
          return (
            <li
              key={u.id}
              className="rounded-2xl border border-border bg-background-secondary p-4 flex items-center gap-4"
            >
              <Link
                href={`/admin/anvandare/${u.id}`}
                className="shrink-0"
                aria-label={`Hantera ${u.display_name ?? u.username}`}
              >
                <UserAvatar
                  src={u.avatar_url ?? ""}
                  alt={u.display_name ?? u.username}
                  size="md"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/anvandare/${u.id}`}
                    className="text-sm font-medium text-foreground hover:underline truncate"
                  >
                    {u.display_name ?? u.username}
                  </Link>
                  <Link
                    href={`/profile/${u.username}`}
                    target="_blank"
                    className="text-xs text-foreground-subtle hover:text-foreground inline-flex items-center gap-1"
                  >
                    @{u.username}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  {u.account_type === "brand" && (
                    <span className="inline-flex rounded-full bg-foreground/10 text-foreground px-2 py-0.5 text-[10px] uppercase tracking-wider">
                      Märke
                    </span>
                  )}
                  {u.is_admin && (
                    <span className="inline-flex rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                  {u.is_demo && (
                    <span className="inline-flex rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                      Demo
                    </span>
                  )}
                  {isViewer && (
                    <span className="inline-flex rounded-full bg-foreground/10 text-foreground px-2 py-0.5 text-[10px] uppercase tracking-wider">
                      Du
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground-subtle mt-0.5">
                  {count} {count === 1 ? "outfit" : "outfits"}
                  {u.bio && ` · ${u.bio}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!isViewer && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleImpersonate(u.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-3 py-1.5 text-xs font-semibold hover:bg-foreground/90 disabled:opacity-50"
                  >
                    <UserCheck className="h-3 w-3" />
                    Posta som
                  </button>
                )}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setEditing(u)}
                  aria-label="Redigera"
                  className="inline-flex items-center justify-center rounded-full border border-border text-foreground h-7 w-7 hover:border-foreground/30 disabled:opacity-50"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                {!isViewer && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleToggleAdmin(u.id)}
                    aria-label={u.is_admin ? "Ta bort admin" : "Gör till admin"}
                    title={u.is_admin ? "Ta bort admin" : "Gör till admin"}
                    className="inline-flex items-center justify-center rounded-full border border-border text-foreground h-7 w-7 hover:border-foreground/30 disabled:opacity-50"
                  >
                    {u.is_admin ? (
                      <ShieldOff className="h-3 w-3" />
                    ) : (
                      <Shield className="h-3 w-3" />
                    )}
                  </button>
                )}
                {!isViewer && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      handleDelete(u.id, u.display_name ?? `@${u.username}`)
                    }
                    aria-label="Radera"
                    className="inline-flex items-center justify-center rounded-full border border-red-500/30 text-red-400 h-7 w-7 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState(user.username);
  const [displayName, setDisplayName] = useState(user.display_name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("avatar", file);
      const res = await uploadUserAvatar(user.id, fd);
      if (res.ok) {
        setAvatarUrl(res.url);
      } else {
        setError(res.error);
      }
    } finally {
      setUploading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateUserProfile(user.id, {
        username,
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
      });
      if (res.ok) onSaved();
      else setError(res.error);
    });
  };

  return (
    <Modal title={`Redigera @${user.username}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Användarnamn">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full rounded-xl bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-subtle p-3 outline-none focus:border-foreground/30 font-mono"
          />
        </Field>
        <Field label="Visningsnamn">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-subtle p-3 outline-none focus:border-foreground/30"
          />
        </Field>
        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full rounded-xl bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-subtle p-3 outline-none focus:border-foreground/30 resize-none"
          />
        </Field>
        <Field label="Profilbild">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 shrink-0 rounded-full overflow-hidden border border-border bg-background-tertiary">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                  unoptimized={avatarUrl.startsWith("http")}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-foreground-subtle">
                  ?
                </div>
              )}
            </div>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => avatarFileRef.current?.click()}
                disabled={uploading || pending}
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-3 py-2 text-xs font-semibold hover:bg-foreground/90 disabled:opacity-60"
              >
                <Upload className="h-3 w-3" />
                {uploading ? "Laddar upp…" : "Välj bild"}
              </button>
              <p className="text-[11px] text-foreground-subtle mt-1.5">
                JPG/PNG/WebP, max 5 MB
              </p>
              <input
                ref={avatarFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarFile(f);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </Field>
        <Field label="Eller klistra in URL">
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://i.pravatar.cc/300?img=10"
            className="w-full rounded-xl bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-subtle p-3 outline-none focus:border-foreground/30"
          />
        </Field>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-border text-foreground py-2.5 text-sm font-medium hover:border-foreground/30"
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-full bg-foreground text-background py-2.5 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-60"
          >
            {pending ? "Sparar…" : "Spara"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createDummyCreator({
        username,
        displayName,
        bio,
        avatarUrl,
      });
      if (res.ok) onCreated();
      else setError(res.error);
    });
  };

  return (
    <Modal title="Skapa ny användare" onClose={onClose}>
      <p className="text-xs text-foreground-subtle mb-4">
        Skapar ett demo-konto utan inloggning. Krä­ver
        SUPABASE_SERVICE_ROLE_KEY i Vercel.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Användarnamn (a–z, 0–9, _)">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required
            pattern="[a-z0-9_]{2,30}"
            placeholder="anna_styles"
            className="w-full rounded-xl bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-subtle p-3 outline-none focus:border-foreground/30 font-mono"
          />
        </Field>
        <Field label="Visningsnamn">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            placeholder="Anna Styles"
            className="w-full rounded-xl bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-subtle p-3 outline-none focus:border-foreground/30"
          />
        </Field>
        <Field label="Bio (valfri)">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Berätta i en mening."
            className="w-full rounded-xl bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-subtle p-3 outline-none focus:border-foreground/30 resize-none"
          />
        </Field>
        <Field label="Avatar-URL (valfri)">
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://i.pravatar.cc/300?img=20"
            className="w-full rounded-xl bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-subtle p-3 outline-none focus:border-foreground/30"
          />
        </Field>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-border text-foreground py-2.5 text-sm font-medium hover:border-foreground/30"
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-full bg-foreground text-background py-2.5 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-60"
          >
            {pending ? "Skapar…" : "Skapa"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-background-secondary border border-foreground/10 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-xl uppercase tracking-tight text-foreground">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Stäng"
            className="text-foreground-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}
