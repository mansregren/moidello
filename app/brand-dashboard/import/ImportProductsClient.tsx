"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { importProductsCsv, type ImportResult } from "@/app/actions/brand-products";

export function ImportProductsClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;
    startTransition(async () => {
      const res = await importProductsCsv(csvText);
      setResult(res);
      if (res.ok) setCsvText("");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <label className="block text-xs uppercase tracking-[0.2em] text-foreground-subtle">
        Klistra in CSV eller välj fil
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-border text-white px-4 py-2 text-sm hover:border-white/30"
        >
          <Upload className="h-4 w-4" />
          Välj CSV-fil
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <p className="text-xs text-foreground-subtle">
          eller klistra in nedan
        </p>
      </div>

      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        placeholder="name,description,price,currency,buy_url,image_url"
        rows={12}
        className="w-full rounded-xl bg-background-tertiary border border-border text-sm text-white placeholder:text-foreground-subtle p-4 outline-none focus:border-white/30 font-mono"
      />

      <button
        type="submit"
        disabled={pending || !csvText.trim()}
        className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-white/90 disabled:opacity-60"
      >
        {pending ? "Importerar…" : "Importera"}
      </button>

      {result && (
        <div className="mt-2 space-y-3">
          {result.ok ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-5 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white">
                  {result.inserted} produkter importerade.
                </p>
                {result.skipped.length > 0 && (
                  <p className="text-xs text-foreground-muted mt-1">
                    {result.skipped.length} rader hoppades över.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.05] p-5 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white">Import misslyckades.</p>
                {result.error && (
                  <p className="text-xs text-red-300 mt-1">{result.error}</p>
                )}
              </div>
            </div>
          )}

          {result.skipped.length > 0 && (
            <details className="rounded-2xl border border-border bg-background-secondary p-5">
              <summary className="text-sm text-white cursor-pointer">
                Hoppade över rader ({result.skipped.length})
              </summary>
              <ul className="mt-3 space-y-1 text-xs text-foreground-muted">
                {result.skipped.map((s, i) => (
                  <li key={i}>
                    Rad {s.row}: {s.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </form>
  );
}
