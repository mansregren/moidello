"use client";

import { useState, useTransition } from "react";
import { Flag, X } from "lucide-react";
import { submitReport } from "@/app/actions/reports";
import { useAuth } from "@/lib/auth-context";

type TargetType = "outfit" | "comment" | "profile";
type Reason =
  | "spam"
  | "harassment"
  | "inappropriate"
  | "misinformation"
  | "impersonation"
  | "copyright"
  | "other";

const REASON_LABELS: Record<Reason, string> = {
  spam: "Spam eller vilseledande marknadsföring",
  harassment: "Trakasserier eller hat",
  inappropriate: "Olämpligt eller stötande innehåll",
  misinformation: "Felaktig information",
  impersonation: "Utger sig för någon annan",
  copyright: "Upphovsrättsintrång",
  other: "Annat",
};

export function ReportButton({
  targetType,
  targetId,
  variant = "icon",
  label,
}: {
  targetType: TargetType;
  targetId: string;
  variant?: "icon" | "menuitem";
  label?: string;
}) {
  const { isLoggedIn, requireAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>("inappropriate");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    if (!isLoggedIn) {
      requireAuth("report");
      return;
    }
    setOpen(true);
    setDone(false);
    setError(null);
    setReason("inappropriate");
    setBody("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await submitReport({
        targetType,
        targetId,
        reason,
        body: body.trim() || undefined,
      });
      if (res.ok) {
        setDone(true);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Rapportera"
          title="Rapportera"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground-muted hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <Flag className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-1.5 text-xs text-foreground-subtle hover:text-foreground-muted transition-colors"
        >
          <Flag className="h-3 w-3" />
          {label ?? "Rapportera"}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-6"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-background-secondary border border-foreground/10 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading text-2xl uppercase tracking-tight text-foreground">
                Rapportera
              </h3>
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                aria-label="Stäng"
                className="text-foreground-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {done ? (
              <>
                <p className="text-sm text-foreground-muted mt-2">
                  Tack — vi har tagit emot din rapport och granskar den så
                  snart vi kan.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-6 w-full rounded-full bg-foreground text-background py-3 text-sm font-semibold hover:bg-foreground/90"
                >
                  Stäng
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="text-sm text-foreground-muted mt-2 mb-5">
                  Berätta vad som är fel. Rapporten är anonym för den
                  rapporterade.
                </p>

                <label className="block text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-2">
                  Anledning
                </label>
                <div className="space-y-2 mb-5">
                  {(Object.keys(REASON_LABELS) as Reason[]).map((r) => (
                    <label
                      key={r}
                      className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-border hover:border-foreground/30 transition-colors"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="mt-1 accent-white"
                      />
                      <span className="text-sm text-foreground">
                        {REASON_LABELS[r]}
                      </span>
                    </label>
                  ))}
                </div>

                <label className="block text-xs uppercase tracking-[0.2em] text-foreground-subtle mb-2">
                  Mer information (valfritt)
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Vad såg du? Vad bör vi titta på?"
                  className="w-full rounded-xl bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-subtle p-3 outline-none focus:border-foreground/30"
                />

                {error && (
                  <p className="mt-3 text-xs text-red-400">{error}</p>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={pending}
                    className="flex-1 rounded-full border border-border text-foreground py-3 text-sm font-medium hover:border-foreground/30"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 rounded-full bg-foreground text-background py-3 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-60"
                  >
                    {pending ? "Skickar…" : "Skicka rapport"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
