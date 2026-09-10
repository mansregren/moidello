import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { notFound } from "next/navigation";
import { OmslagClient, type CoverCandidate } from "./OmslagClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Omslag · Admin" };

export default async function OmslagPage() {
  if (!(await isCurrentUserAdmin())) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("outfits")
    .select("id, title, image_url, category, vertical, is_category_cover")
    .eq("is_published", true)
    .not("category", "is", null)
    .order("created_at", { ascending: false })
    .limit(1000);

  const rows = ((data ?? []) as Array<{
    id: string;
    title: string;
    image_url: string;
    category: string;
    vertical: string;
    is_category_cover: boolean;
  }>).map<CoverCandidate>((r) => ({
    id: r.id,
    title: r.title,
    imageUrl: r.image_url,
    category: r.category,
    vertical: r.vertical === "hem" ? "hem" : "mode",
    isCover: !!r.is_category_cover,
  }));

  return (
    <div className="max-w-5xl">
      <h1 className="font-heading text-3xl uppercase tracking-tight text-foreground mb-2">
        Kategori-omslag
      </h1>
      <p className="text-sm text-foreground-muted mb-8">
        Choose which image is the cover on each category card (the /home
        rooms and the fashion categories). Click an image to make it the
        cover. Without a choice the newest post is shown automatically.
      </p>
      <OmslagClient rows={rows} />
    </div>
  );
}
