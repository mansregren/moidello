"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface Props {
  outfitId: string;
  code: string | null;
}

export function ShareImageButton({ outfitId, code }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/share-image/${outfitId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        alert(`Kunde inte hämta bilden (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `moidello-${code ?? outfitId.slice(0, 8)}-9x16.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={busy}
      className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-foreground/30 disabled:opacity-50"
    >
      <Download className="h-3.5 w-3.5" />
      {busy ? "Hämtar…" : "9:16 PNG"}
    </button>
  );
}
