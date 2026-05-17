"use client";

import { useState } from "react";
import { Sparkles, AlertCircle, Check } from "lucide-react";

interface MissingItem {
  id: string;
  brand: string;
  name: string;
  garment: string;
  color: string | null;
}

interface Props {
  missing: MissingItem[];
}

interface Result {
  processed: Array<{ id: string; brand: string; name: string }>;
  errors: Array<{ id: string; error: string }>;
  total_candidates: number;
}

export function ItemSeoBackfillClient({ missing }: Props) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [batchSize, setBatchSize] = useState(30);

  async function run() {
    if (running) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/items/seo-backfill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ onlyMissing: true, limit: batchSize }),
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
          AI-genererar description, keywords, alt-text och material för plagg
          (tagged_items) som saknar fält. Text-only Claude — ~$0.002 per
          plagg, batchas så Vercel-timeouten håller.
        </p>
        <label className="flex items-center gap-2 text-sm text-foreground mb-4">
          Batch-storlek
          <input
            type="number"
            min={1}
            max={80}
            value={batchSize}
            onChange={(e) =>
              setBatchSize(
                Math.max(1, Math.min(80, Number(e.target.value) || 30)),
              )
            }
            className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm tabular-nums"
          />
          <span className="text-xs text-foreground-subtle">(max 80)</span>
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
              : `Backfilla ${Math.min(batchSize, missing.length)} av ${missing.length} plagg`}
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
                  <span className="text-foreground/80">
                    {p.brand} {p.name}
                  </span>
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
            {missing.slice(0, 100).map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-3 text-sm rounded-xl border border-border bg-background-secondary px-4 py-2.5"
              >
                <span className="text-foreground flex-1 truncate">
                  <span className="text-foreground/70">{it.brand}</span>{" "}
                  {it.name}
                </span>
                <span className="text-[11px] text-foreground-subtle capitalize">
                  {it.garment?.toLowerCase()}
                </span>
                {it.color && (
                  <span className="text-[11px] text-foreground-muted capitalize">
                    {it.color}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {missing.length > 100 && (
            <p className="mt-3 text-xs text-foreground-subtle">
              … visar 100 första av {missing.length}.
            </p>
          )}
        </section>
      )}
    </>
  );
}
