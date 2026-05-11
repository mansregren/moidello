"use client";

import { useState, useTransition } from "react";
import { Download, Trash2, AlertTriangle } from "lucide-react";
import { exportMyData, deleteMyAccount } from "@/app/actions/account";
import { PushToggle } from "@/components/settings/PushToggle";

export function AccountSettingsClient({ username }: { username: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typedUsername, setTypedUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = () => {
    setExportError(null);
    startTransition(async () => {
      const res = await exportMyData();
      if (!res.ok) {
        setExportError(res.error);
        return;
      }
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `moidello-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteMyAccount(typedUsername);
      if (!res.ok) {
        setError(res.error);
      }
      // On success the server action redirects, so this code never runs.
    });
  };

  return (
    <div className="mt-12 space-y-6">
      <PushToggle />

      <section className="rounded-2xl border border-border bg-background-secondary p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black">
            <Download className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-xl uppercase tracking-tight text-white">
              Exportera mina data
            </h2>
            <p className="mt-2 text-sm text-foreground-muted">
              Ladda ner en JSON-fil med din profil, outfits, taggade plagg,
              kommentarer, sparade objekt, följare, samlingar och meddelanden.
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={handleExport}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2.5 text-sm font-semibold hover:bg-white/90 disabled:opacity-60"
            >
              {pending ? "Förbereder…" : "Ladda ner JSON"}
            </button>
            {exportError && (
              <p className="mt-3 text-xs text-red-400">{exportError}</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-red-500/30 bg-red-500/[0.04] p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <Trash2 className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-xl uppercase tracking-tight text-white">
              Radera mitt konto
            </h2>
            <p className="mt-2 text-sm text-foreground-muted">
              Detta tar bort din profil, alla dina outfits, kommentarer,
              följningar, samlingar och meddelanden. Det går inte att ångra.
            </p>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-red-500/40 text-red-400 px-5 py-2.5 text-sm font-semibold hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Påbörja radering
              </button>
            ) : (
              <div className="mt-5 rounded-2xl border border-red-500/40 bg-background-tertiary p-5">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground-muted">
                    Skriv ditt användarnamn{" "}
                    <span className="font-mono text-white">{username}</span>{" "}
                    för att bekräfta.
                  </p>
                </div>
                <input
                  type="text"
                  value={typedUsername}
                  onChange={(e) => setTypedUsername(e.target.value)}
                  placeholder={username}
                  className="w-full rounded-xl bg-background-secondary border border-border text-sm text-white placeholder:text-foreground-subtle p-3 outline-none focus:border-white/30 font-mono"
                  autoComplete="off"
                />
                {error && (
                  <p className="mt-3 text-xs text-red-400">{error}</p>
                )}
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setConfirmDelete(false);
                      setTypedUsername("");
                      setError(null);
                    }}
                    className="flex-1 rounded-full border border-border text-white py-2.5 text-sm font-medium hover:border-white/30"
                  >
                    Avbryt
                  </button>
                  <button
                    type="button"
                    disabled={pending || typedUsername !== username}
                    onClick={handleDelete}
                    className="flex-1 rounded-full bg-red-500 text-white py-2.5 text-sm font-semibold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {pending ? "Raderar…" : "Radera mitt konto"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
