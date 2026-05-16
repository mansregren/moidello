"use client";

import { useState } from "react";
import { Sparkles, AlertCircle, Check } from "lucide-react";

interface MissingRow {
  id: string;
  code: string | null;
  title: string;
  created_at: string;
}

interface Props {
  missing: MissingRow[];
}

interface Result {
  processed: Array<{ id: string; title: string; new_title: string }>;
  errors: Array<{ id: string; error: string }>;
  total_candidates: number;
}

export function SeoBackfillClient({ missing }: Props) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [overwriteTitle, setOverwriteTitle] = useState(true);

  async function run() {
    if (running) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/seo-backfill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          onlyMissing: true,
          overwriteTitle,
        }),
        cache: "no-store",
      });
      const json = (await res.json()) as Result | { error: string };
      if ("error" in json) {
        setResult({
          processed: [],
          errors: [{ id: "—", error: json.error }],
          total_candidates: 0,
        });
      } else {
        setResult(json);
      }
    } catch (e) {
      setResult({
        processed: [],
        errors: [{ id: "—", error: String(e) }],
        total_candidates: 0,
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-background-secondary p-5 mb-6">
        <p className="text-sm text-foreground-muted mb-4">
          AI-genererar title, beskrivning, meta-description, keywords och
          alt-text för outfits som saknar något av fälten. Använder Claude
          Sonnet 4.6 med vision — kostar ~$0.01 per outfit.
        </p>
        <label className="flex items-center gap-2 text-sm text-foreground mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={overwriteTitle}
            onChange={(e) => setOverwriteTitle(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-foreground"
          />
          Skriv över existerande title (rekommenderat — många är "Casual",
          "Sporty", produktnamn-stuff)
        </label>
        <button
          type="button"
          onClick={run}
          disabled={running || missing.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {running
            ? "Bearbetar…"
            : missing.length === 0
              ? "Allt är OK"
              : `Backfilla ${missing.length} outfits`}
        </button>
      </div>

      {result && (
        <div className="rounded-2xl border border-border bg-background-secondary p-5 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Resultat: {result.processed.length} uppdaterade,{" "}
            {result.errors.length} fel
          </h3>
          {result.processed.length > 0 && (
            <ul className="space-y-1.5 mb-4 text-sm">
              {result.processed.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start gap-2 text-foreground-muted"
                >
                  <Check className="h-3.5 w-3.5 mt-0.5 text-emerald-400 shrink-0" />
                  <span className="text-foreground/80">{p.title}</span>
                  {p.new_title !== p.title && (
                    <span className="text-foreground-subtle">
                      → {p.new_title}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {result.errors.length > 0 && (
            <ul className="space-y-1.5 text-sm">
              {result.errors.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-red-300">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    {e.id.slice(0, 8)}: {e.error}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {missing.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-[0.25em] text-foreground-subtle mb-3">
            Saknar SEO ({missing.length})
          </h2>
          <ul className="space-y-1.5">
            {missing.map((o) => (
              <li
                key={o.id}
                className="flex items-center gap-3 text-sm rounded-xl border border-border bg-background-secondary px-4 py-2.5"
              >
                {o.code && (
                  <span className="text-[10px] uppercase tracking-wider text-foreground-muted">
                    #{o.code}
                  </span>
                )}
                <span className="text-foreground flex-1 truncate">
                  {o.title}
                </span>
                <span className="text-[11px] text-foreground-subtle">
                  {new Date(o.created_at).toLocaleDateString("sv-SE")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
