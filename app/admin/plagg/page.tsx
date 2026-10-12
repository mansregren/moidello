import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { CATALOG_SELECT, toCatalogItem, type CatalogRow } from "@/lib/catalog/types";
import { PlaggClient } from "./PlaggClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Plaggbank · Admin" };

export default async function PlaggPage() {
  if (!(await isCurrentUserAdmin())) notFound();

  const supabase = await createClient();
  const [{ data: rows }, { data: links }, { count: unlinked }] = await Promise.all([
    supabase
      .from("catalog_items")
      .select(CATALOG_SELECT)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("tagged_items")
      .select("catalog_item_id")
      .not("catalog_item_id", "is", null)
      .limit(20000),
    supabase
      .from("tagged_items")
      .select("id", { count: "exact", head: true })
      .is("catalog_item_id", null)
      .not("image_url", "is", null),
  ]);

  const usage = new Map<string, number>();
  for (const l of links ?? []) {
    const id = l.catalog_item_id as string;
    usage.set(id, (usage.get(id) ?? 0) + 1);
  }
  const items = ((rows ?? []) as CatalogRow[]).map((r) =>
    toCatalogItem(r, usage.get(r.id) ?? 0),
  );

  return (
    <div>
      <h1 className="font-heading text-3xl uppercase tracking-tight text-foreground mb-2">
        Plaggbank
      </h1>
      <p className="text-sm text-foreground-muted mb-8 max-w-2xl">
        Alla plagg du kan klicka ihop outfits av. Klistra in produktlänkar så
        hämtas bild, märke, namn och pris automatiskt. Bilden kopieras till
        vår egen lagring, så den slutar aldrig fungera. Bygg outfits under{" "}
        <Link href="/admin/snabb-outfit" className="underline underline-offset-2">
          Snabb-outfit
        </Link>
        .
      </p>
      <PlaggClient initialItems={items} unlinkedTagCount={unlinked ?? 0} />
    </div>
  );
}
