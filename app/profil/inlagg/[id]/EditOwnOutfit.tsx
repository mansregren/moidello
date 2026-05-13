"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { updateOwnOutfit } from "@/app/actions/user-content";

export interface OwnOutfitForm {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  isPublished: boolean;
  publicUrl: string;
}

const CATEGORIES = [
  "Streetwear",
  "Minimalism",
  "Vintage",
  "Casual",
  "Formal",
  "Sporty",
  "Bohemian",
  "Preppy",
];

const INPUT =
  "w-full rounded-xl bg-background-tertiary border border-border text-sm text-white placeholder:text-foreground-subtle p-3 outline-none focus:border-white/30";

export function EditOwnOutfit({ form: initial }: { form: OwnOutfitForm }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await updateOwnOutfit(form.id, {
        title: form.title,
        description: form.description || null,
        category: form.category || null,
      });
      if (res.ok) {
        setSuccess("Sparat.");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-background-secondary p-6">
      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-background-tertiary">
          <Image
            src={form.imageUrl}
            alt={form.title}
            fill
            sizes="200px"
            className="object-cover"
            unoptimized={form.imageUrl.startsWith("http")}
          />
          {!form.isPublished && (
            <span className="absolute top-2 left-2 inline-flex rounded-full bg-amber-500/90 text-black px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold">
              Utkast
            </span>
          )}
        </div>

        <form onSubmit={save} className="space-y-4">
          <Field label="Titel">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={200}
              className={INPUT}
            />
          </Field>

          <Field label="Beskrivning">
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={4}
              maxLength={2000}
              className={`${INPUT} resize-none`}
            />
          </Field>

          <Field label="Kategori">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={INPUT}
            >
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <p className="text-[11px] text-foreground-subtle">
            SEO-meta, schemaläggning och kön hanteras av admin. Vill du dölja
            eller radera inlägget, använd knapparna på{" "}
            <a
              href={form.publicUrl}
              className="underline hover:text-white"
            >
              outfit-sidan
            </a>
            .
          </p>

          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && <p className="text-xs text-emerald-300">{success}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {pending ? "Sparar…" : "Spara"}
            </button>
          </div>
        </form>
      </div>
    </section>
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
