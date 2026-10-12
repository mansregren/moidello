import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getImpersonationTarget, isCurrentUserAdmin } from "@/lib/admin";
import { CATALOG_SELECT, toCatalogItem, type CatalogRow } from "@/lib/catalog/types";
import { parseBuilderLayout } from "@/lib/catalog/layout";
import { BuilderClient, type EditingOutfit } from "./BuilderClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Snabb-outfit · Admin" };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SnabbOutfitPage({
  searchParams,
}: {
  searchParams: Promise<{ outfit?: string }>;
}) {
  if (!(await isCurrentUserAdmin())) notFound();
  const { outfit: outfitId } = await searchParams;

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
  const items = ((rows ?? []) as CatalogRow[]).map((r) => toCatalogItem(r));

  // Edit mode: reopen a published flatlay from its stored layout.
  let editing: EditingOutfit | null = null;
  let editError: string | null = null;
  if (outfitId && UUID_RE.test(outfitId)) {
    const { data: o } = await supabase
      .from("outfits")
      .select(
        "id, title, description, category, gender, slug, builder_layout, profiles!outfits_user_id_fkey(username)",
      )
      .eq("id", outfitId)
      .maybeSingle();
    const layout = o ? parseBuilderLayout(o.builder_layout) : null;
    if (!o) {
      editError = "Outfiten finns inte.";
    } else if (!layout) {
      editError =
        "Den här outfiten skapades inte i Snabb-outfit (eller före redigering fanns), så den saknar layout och kan inte öppnas här.";
    } else {
      // Garments archived since publishing must still load into the layout.
      const known = new Set(items.map((i) => i.id));
      const missing = layout.items.map((i) => i.catalogItemId).filter((id) => !known.has(id));
      if (missing.length > 0) {
        const { data: extra } = await supabase
          .from("catalog_items")
          .select(CATALOG_SELECT)
          .in("id", missing);
        for (const r of (extra ?? []) as CatalogRow[]) items.push(toCatalogItem(r));
      }
      const username = (o.profiles as { username?: string } | null)?.username?.toLowerCase();
      editing = {
        id: o.id as string,
        url: username && o.slug ? `/${username}/${o.slug}` : `/outfit/${o.id}`,
        title: o.title as string,
        description: (o.description as string | null) ?? "",
        category: (o.category as string | null) ?? "Casual",
        gender: o.gender === "dam" ? "dam" : "herr",
        layout,
      };
    }
  }

  let publishAs = impersonation?.targetUsername ?? null;
  if (!publishAs && auth.user) {
    const { data: me } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", auth.user.id)
      .maybeSingle();
    publishAs = (me?.username as string | null) ?? null;
  }

  return (
    <div>
      <h1 className="font-heading text-3xl uppercase tracking-tight text-foreground mb-2">
        Snabb-outfit
      </h1>
      <p className="text-sm text-foreground-muted mb-8 max-w-2xl">
        Klicka på plagg för att lägga dem i outfiten. De placeras automatiskt,
        men du kan dra, ändra storlek, rotera och byta ordning. Bilden genereras
        och taggarna placeras när du publicerar. Publicerade outfits kan öppnas
        här igen och redigeras.
      </p>
      {editError && (
        <p className="mb-6 rounded-xl border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {editError}
        </p>
      )}
      <BuilderClient
        key={editing?.id ?? "new"}
        items={items}
        publishAs={publishAs}
        impersonating={!!impersonation}
        editing={editing}
      />
    </div>
  );
}
