import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { notFound } from "next/navigation";
import { BildFyllClient, type FillRow } from "./BildFyllClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Fyll bilder · Admin" };

export default async function BildFyllPage() {
  if (!(await isCurrentUserAdmin())) notFound();

  const supabase = await createClient();
  // Only images hosted in our own storage (image_path set) can have the
  // legacy #F7F6F3 padding — external/seeded image_urls are raw.
  const { data } = await supabase
    .from("outfits")
    .select("id, title, image_url, image_path")
    .not("image_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(1000);

  const rows = ((data ?? []) as Array<{
    id: string;
    title: string;
    image_url: string;
    image_path: string | null;
  }>).map<FillRow>((r) => ({
    id: r.id,
    title: r.title,
    imageUrl: r.image_url,
  }));

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-3xl uppercase tracking-tight text-foreground mb-2">
        Fyll bilder
      </h1>
      <p className="text-sm text-foreground-muted mb-8">
        Går igenom alla {rows.length} uppladdade bilder, beskär bort den beige
        paddingen (#F7F6F3) så fotot fyller rutan, och sparar en ny version.
        Originalfilen behålls (backbart). Bilder utan padding rörs inte.
      </p>
      <BildFyllClient rows={rows} />
    </div>
  );
}
