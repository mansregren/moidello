"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Link as LinkIcon,
  Loader2,
  Sparkles,
  Globe,
  AlertCircle,
  Tag as TagIcon,
} from "lucide-react";
import { addTaggedItem } from "@/app/actions/admin-content";
import {
  garmentOptions,
  garmentsForGender,
  type Gender,
} from "@/lib/garments";

interface PreviewResult {
  brand: string | null;
  product_name: string | null;
  price: number | null;
  currency: string | null;
  color: string | null;
  image_url: string | null;
  retailer: string | null;
  retailer_locale: string | null;
  is_affiliate: boolean;
  affiliate_network: string | null;
  _raw?: unknown;
}

interface Draft {
  url: string;
  brand: string;
  product_name: string;
  price: string;
  currency: string;
  color: string;
  image_url: string;
  retailer: string | null;
  retailer_locale: string | null;
  is_affiliate: boolean;
  affiliate_network: string | null;
  raw: unknown;
}

const INPUT =
  "w-full rounded-xl bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-subtle p-3 outline-none focus:border-foreground/30";

export function PasteTagForm({
  outfitId,
  gender,
}: {
  outfitId: string;
  gender: Gender;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [garment, setGarment] = useState(garmentsForGender(gender)[0]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [fetching, setFetching] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const preview = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setError(null);
    setInfo(null);
    setFetching(true);
    try {
      const res = await fetch("/api/admin/items/preview-from-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as PreviewResult;
      setDraft({
        url: trimmed,
        brand: data.brand ?? "",
        product_name: data.product_name ?? "",
        price: data.price != null ? String(data.price) : "",
        currency: (data.currency ?? "SEK").toUpperCase(),
        color: data.color ?? "",
        image_url: data.image_url ?? "",
        retailer: data.retailer,
        retailer_locale: data.retailer_locale,
        is_affiliate: data.is_affiliate,
        affiliate_network: data.affiliate_network,
        raw: data._raw,
      });
      if (!data.brand && !data.product_name) {
        setInfo(
          "Sidan svarade men vi hittade inga produktdata. Fyll i manuellt.",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte hämta preview.");
      // Open a blank draft so admin can still fill in manually.
      setDraft({
        url: trimmed,
        brand: "",
        product_name: "",
        price: "",
        currency: "SEK",
        color: "",
        image_url: "",
        retailer: null,
        retailer_locale: null,
        is_affiliate: false,
        affiliate_network: null,
        raw: null,
      });
    } finally {
      setFetching(false);
    }
  };

  const reset = () => {
    setDraft(null);
    setUrl("");
    setError(null);
    setInfo(null);
  };

  const save = () => {
    if (!draft) return;
    if (!draft.brand.trim() || !draft.product_name.trim()) {
      setError("Märke och plaggnamn måste fyllas i.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await addTaggedItem(outfitId, {
        brand: draft.brand,
        name: draft.product_name,
        buy_url: draft.url,
        price: draft.price ? Number(draft.price) : null,
        currency: draft.currency,
        color: draft.color || null,
        image_url: draft.image_url || null,
        retailer: draft.retailer,
        retailer_locale: draft.retailer_locale,
        is_affiliate: draft.is_affiliate,
        affiliate_network: draft.affiliate_network,
        garment,
        cached_metadata: (draft.raw as Record<string, unknown> | null) ?? null,
      });
      if (res.ok) {
        reset();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-background-secondary p-6">
      <h2 className="font-heading text-xl uppercase tracking-tight text-foreground mb-1">
        Lägg till plagg-tag
      </h2>
      <p className="text-xs text-foreground-subtle mb-5">
        Klistra in en produkt-URL — vi fyller i brand, namn, pris och bild
        automatiskt. Ändra fritt innan du sparar.
      </p>

      {!draft ? (
        <div className="space-y-3">
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                if (pasted) {
                  setUrl(pasted);
                  // Kick off preview right after paste so admin doesn't
                  // need to also click a button.
                  setTimeout(() => preview(pasted), 0);
                  e.preventDefault();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  preview(url);
                }
              }}
              placeholder="https://johnhenric.com/se/..."
              disabled={fetching}
              className={`${INPUT} pl-10`}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => preview(url)}
              disabled={fetching || !url.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-60"
            >
              {fetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Hämta info
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {info && <p className="text-xs text-amber-300">{info}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <StatusBadge draft={draft} />

          <div className="grid sm:grid-cols-[160px_1fr] gap-4">
            {draft.image_url ? (
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-background-tertiary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={draft.image_url}
                  alt={draft.product_name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[3/4] rounded-lg border border-dashed border-border flex items-center justify-center text-foreground-subtle text-xs">
                Ingen bild
              </div>
            )}

            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Märke"
                  value={draft.brand}
                  onChange={(e) =>
                    setDraft({ ...draft, brand: e.target.value })
                  }
                  className={INPUT}
                />
                <select
                  value={garment}
                  onChange={(e) => setGarment(e.target.value)}
                  className={INPUT}
                >
                  {garmentOptions(gender, garment).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Plaggnamn"
                value={draft.product_name}
                onChange={(e) =>
                  setDraft({ ...draft, product_name: e.target.value })
                }
                className={INPUT}
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Pris"
                  min="0"
                  step="1"
                  value={draft.price}
                  onChange={(e) =>
                    setDraft({ ...draft, price: e.target.value })
                  }
                  className={INPUT}
                />
                <input
                  type="text"
                  placeholder="Valuta"
                  maxLength={8}
                  value={draft.currency}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      currency: e.target.value.toUpperCase().slice(0, 8),
                    })
                  }
                  className={INPUT}
                />
                <input
                  type="text"
                  placeholder="Färg"
                  value={draft.color}
                  onChange={(e) =>
                    setDraft({ ...draft, color: e.target.value })
                  }
                  className={INPUT}
                />
              </div>
              <input
                type="text"
                placeholder="Bild-URL"
                value={draft.image_url}
                onChange={(e) =>
                  setDraft({ ...draft, image_url: e.target.value })
                }
                className={INPUT}
              />
              <input
                type="text"
                value={draft.url}
                readOnly
                className={`${INPUT} text-foreground-muted`}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={reset}
              disabled={pending}
              className="rounded-full border border-border text-foreground-muted hover:text-foreground hover:border-foreground/30 px-4 py-2 text-xs disabled:opacity-60"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2 text-xs font-semibold hover:bg-foreground/90 disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <TagIcon className="h-3 w-3" />
              )}
              Spara tagg
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ draft }: { draft: Draft }) {
  if (draft.is_affiliate) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-200 px-3 py-1.5 text-xs">
        <AlertCircle className="h-3.5 w-3.5" />
        Affiliate-länk ({draft.affiliate_network ?? "okänt nätverk"}) —
        skickas oförändrad
      </div>
    );
  }
  if (draft.retailer) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 px-3 py-1.5 text-xs">
        <Globe className="h-3.5 w-3.5" />
        {draft.retailer} ({draft.retailer_locale ?? "?"}) — geo-anpassas
        automatiskt
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-200 px-3 py-1.5 text-xs">
      <AlertCircle className="h-3.5 w-3.5" />
      Okänd retailer — länken skickas som-den-är
    </div>
  );
}
