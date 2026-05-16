import { createClient } from "@/lib/supabase/server";
import { TikTokBilderClient } from "./TikTokBilderClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TikTok-bilder · Admin",
};

interface OutfitFetchRow {
  id: string;
  title: string;
  image_url: string;
  code: string | null;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
  } | null;
  tagged_items: Array<{
    id: string;
    brand: string;
    name: string;
    garment: string;
  }> | null;
}

export default async function AdminTikTokBilderPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("outfits")
    .select(
      `id, title, image_url, code, created_at,
       profiles:profiles!outfits_user_id_fkey ( username, display_name ),
       tagged_items ( id, brand, name, garment )`,
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const outfits = ((data ?? []) as unknown as OutfitFetchRow[]).map((o) => ({
    id: o.id,
    title: o.title,
    image_url: o.image_url,
    code: o.code,
    username: o.profiles?.username ?? "okänd",
    tags: (o.tagged_items ?? []).map((t) => ({
      id: t.id,
      brand: t.brand,
      name: t.name,
      garment: t.garment,
    })),
  }));

  return (
    <>
      <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-3">
        Admin
      </p>
      <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight leading-none">
        TikTok-bilder
      </h1>
      <p className="mt-4 text-foreground-muted max-w-2xl">
        Per outfit får du ett TikTok-paket: hero-bild + en bild per plagg
        (max 5), AI-genererad rubrik + beskrivning + 5 hashtags. Tryck
        Paket på ett kort. På iPhone öppnas delningsmenyn så bilderna
        landar i kamerarullen.
      </p>

      <div className="mt-8">
        {outfits.length === 0 ? (
          <p className="text-sm text-foreground-subtle">
            Inga publicerade outfits.
          </p>
        ) : (
          <TikTokBilderClient outfits={outfits} />
        )}
      </div>
    </>
  );
}
