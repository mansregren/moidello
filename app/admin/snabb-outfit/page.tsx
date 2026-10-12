import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getImpersonationTarget, isCurrentUserAdmin } from "@/lib/admin";
import { CATALOG_SELECT, toCatalogItem, type CatalogRow } from "@/lib/catalog/types";
import { BuilderClient } from "./BuilderClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Snabb-outfit · Admin" };

export default async function SnabbOutfitPage() {
  if (!(await isCurrentUserAdmin())) notFound();

  const supabase = await createClient();
  const [{ data: rows }, impersonation, { data: auth }] = await Promise.all([
    supabase
      .from("catalog_items")
      .select(CATALOG_SELECT)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(5000),
    getImpersonationTarget(),
    supabase.auth.getUser(),
  ]);

  let publishAs = impersonation?.targetUsername ?? null;
  if (!publishAs && auth.user) {
    const { data: me } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", auth.user.id)
      .maybeSingle();
    publishAs = (me?.username as string | null) ?? null;
  }

  const items = ((rows ?? []) as CatalogRow[]).map((r) => toCatalogItem(r));

  return (
    <div>
      <h1 className="font-heading text-3xl uppercase tracking-tight text-foreground mb-2">
        Snabb-outfit
      </h1>
      <p className="text-sm text-foreground-muted mb-8 max-w-2xl">
        Klicka på plagg för att lägga dem i outfiten. De placeras automatiskt,
        men du kan dra, ändra storlek och byta ordning. Bilden genereras och
        taggarna placeras när du publicerar.
      </p>
      <BuilderClient
        items={items}
        publishAs={publishAs}
        impersonating={!!impersonation}
      />
    </div>
  );
}
