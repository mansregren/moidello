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
} from "lucide-react";
import { UserAvatar } from "@/components/user/UserAvatar";
import {
  startImpersonation,
  toggleAdmin,
  deleteUserAccount,
  seedDummyCreators,
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
  created_at: string;
}

export function UsersClient({
  users,
  outfitCounts,
  viewerId,
  initialQuery,
}: {
  users: UserRow[];
  outfitCounts: Record<string, number>;
  viewerId: string | null;
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [topError, setTopError] = useState<string | null>(null);
  const [seedReport, setSeedReport] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    router.push(`/admin/anvandare${qs}`);
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
              className="w-full rounded-full bg-background-secondary border border-border pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-foreground-subtle outline-none focus:border-white/30"
            />
          </div>
        </form>
        <button
          type="button"
          onClick={handleSeed}
          className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2.5 text-sm font-semibold hover:bg-white/90"
        >
          <Sparkles className="h-4 w-4" />
          Seed 8 demo-kreatörer
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
              <UserAvatar
                src={u.avatar_url ?? ""}
                alt={u.display_name ?? u.username}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/profile/${u.username}`}
                    className="text-sm font-medium text-white hover:underline truncate inline-flex items-center gap-1"
                  >
                    {u.display_name ?? u.username}
                    <ExternalLink className="h-3 w-3 text-foreground-subtle" />
                  </Link>
                  <span className="text-xs text-foreground-subtle">
                    @{u.username}
                  </span>
                  {u.account_type === "brand" && (
                    <span className="inline-flex rounded-full bg-white/10 text-white px-2 py-0.5 text-[10px] uppercase tracking-wider">
                      Märke
                    </span>
                  )}
                  {u.is_admin && (
                    <span className="inline-flex rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                  {isViewer && (
                    <span className="inline-flex rounded-full bg-white/10 text-white px-2 py-0.5 text-[10px] uppercase tracking-wider">
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-white text-black px-3 py-1.5 text-xs font-semibold hover:bg-white/90 disabled:opacity-50"
                  >
                    <UserCheck className="h-3 w-3" />
                    Posta som
                  </button>
                )}
                {!isViewer && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleToggleAdmin(u.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border text-white px-3 py-1.5 text-xs hover:border-white/30 disabled:opacity-50"
                  >
                    {u.is_admin ? (
                      <>
                        <ShieldOff className="h-3 w-3" />
                        Ta bort admin
                      </>
                    ) : (
                      <>
                        <Shield className="h-3 w-3" />
                        Gör till admin
                      </>
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
    </>
  );
}
