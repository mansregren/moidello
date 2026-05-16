import Image from "next/image";
import Link from "next/link";
import { Hash } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ShareImageButton } from "./ShareImageButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TikTok-bilder · Admin",
};

interface OutfitListRow {
  id: string;
  title: string;
  image_url: string;
  code: string | null;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
  } | null;
}

export default async function AdminTikTokBilderPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("outfits")
    .select(
      `id, title, image_url, code, created_at,
       profiles:profiles!outfits_user_id_fkey ( username, display_name )`,
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const outfits = (data ?? []) as unknown as OutfitListRow[];

  return (
    <>
      <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-3">
        Admin
      </p>
      <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight leading-none">
        TikTok-bilder
      </h1>
      <p className="mt-4 text-foreground-muted max-w-2xl">
        Ladda ner en 9:16-bild per outfit för delning på TikTok eller
        Stories. Bilden innehåller outfit-foto, prick-markörer på
        plagg-positioner, outfit-koden + moidello.com.
      </p>

      <section className="mt-10">
        {outfits.length === 0 ? (
          <p className="text-sm text-foreground-subtle">
            Inga publicerade outfits.
          </p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {outfits.map((o) => (
              <li
                key={o.id}
                className="rounded-2xl border border-border bg-background-secondary overflow-hidden flex flex-col"
              >
                <Link
                  href={`/admin/inlagg/${o.id}`}
                  className="relative aspect-[4/5] bg-background-tertiary"
                >
                  <Image
                    src={o.image_url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                    unoptimized={o.image_url.startsWith("http")}
                  />
                  {o.code && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/85 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-foreground">
                      <Hash className="h-3 w-3" />
                      {o.code}
                    </span>
                  )}
                </Link>
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {o.title}
                  </p>
                  <p className="text-[11px] text-foreground-subtle line-clamp-1">
                    @
                    {o.profiles?.username ?? "okänd"}
                  </p>
                  <div className="mt-auto">
                    <ShareImageButton outfitId={o.id} code={o.code} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
