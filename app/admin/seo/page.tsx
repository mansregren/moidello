import { createClient } from "@/lib/supabase/server";
import { SeoBackfillClient } from "./SeoBackfillClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SEO · Admin",
};

interface OutfitRow {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  alt_text: string | null;
  created_at: string;
}

export default async function AdminSeoPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("outfits")
    .select(
      "id, code, title, description, meta_description, keywords, alt_text, created_at",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as OutfitRow[];
  const missing = rows
    .filter(
      (o) =>
        !o.description ||
        !o.meta_description ||
        !o.keywords ||
        o.keywords.length === 0 ||
        !o.alt_text,
    )
    .map((o) => ({
      id: o.id,
      code: o.code,
      title: o.title,
      created_at: o.created_at,
    }));

  return (
    <>
      <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-3">
        Admin
      </p>
      <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight leading-none">
        SEO
      </h1>
      <p className="mt-4 text-foreground-muted max-w-2xl">
        AI-backfill av title, beskrivning, meta-description, keywords och
        alt-text. Klicka på Backfilla för att processa alla outfits som
        saknar något fält.
      </p>

      <div className="mt-8">
        <SeoBackfillClient missing={missing} />
      </div>
    </>
  );
}
