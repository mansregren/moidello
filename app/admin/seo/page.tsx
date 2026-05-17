import { createClient } from "@/lib/supabase/server";
import { SeoBackfillClient } from "./SeoBackfillClient";
import { ItemSeoBackfillClient } from "./ItemSeoBackfillClient";

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

interface ItemRow {
  id: string;
  brand: string;
  name: string;
  garment: string;
  color: string | null;
  description: string | null;
  keywords: string[] | null;
  alt_text: string | null;
}

export default async function AdminSeoPage() {
  const supabase = await createClient();

  const [outfitRes, itemRes] = await Promise.all([
    supabase
      .from("outfits")
      .select(
        "id, code, title, description, meta_description, keywords, alt_text, created_at",
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("tagged_items")
      .select(
        "id, brand, name, garment, color, description, keywords, alt_text",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const outfitRows = (outfitRes.data ?? []) as OutfitRow[];
  const missingOutfits = outfitRows
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

  // PostgREST-generated types don't include columns added in the latest
  // migration (0036) until the schema cache rebuilds — cast via unknown.
  const itemRows = (itemRes.data ?? []) as unknown as ItemRow[];
  const missingItems = itemRows
    .filter(
      (it) =>
        !it.description ||
        !it.keywords ||
        it.keywords.length === 0 ||
        !it.alt_text,
    )
    .map((it) => ({
      id: it.id,
      brand: it.brand,
      name: it.name,
      garment: it.garment,
      color: it.color,
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
        AI-backfill av meta-data för outfits och taggade plagg. Två
        separata pipelines — outfits använder Claude vision (bild + ev.
        kategori-hint), plagg använder Claude text (brand/namn/färg-fakta).
      </p>

      <section className="mt-12">
        <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-1">
          Outfits
        </h2>
        <p className="text-xs uppercase tracking-wider text-foreground-subtle mb-5">
          Title · beskrivning · meta-description · keywords · alt-text
        </p>
        <SeoBackfillClient missing={missingOutfits} />
      </section>

      <section className="mt-16">
        <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-1">
          Plagg
        </h2>
        <p className="text-xs uppercase tracking-wider text-foreground-subtle mb-5">
          Description · keywords · alt-text · material
        </p>
        <ItemSeoBackfillClient missing={missingItems} />
      </section>
    </>
  );
}
