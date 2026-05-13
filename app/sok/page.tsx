import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { UserAvatar } from "@/components/user/UserAvatar";
import { createPublicClient } from "@/lib/supabase/public";
import { outfitPathFromParts } from "@/lib/outfit-url";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface ProfileHit {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  account_type: "creator" | "brand" | null;
  brand_name: string | null;
}

interface OutfitHit {
  id: string;
  slug: string | null;
  title: string;
  image_url: string;
  description: string | null;
  profiles: { username: string } | null;
}

interface BrandHit {
  brand: string;
  // count of outfits using this brand
  count: number;
}

function escapeIlike(s: string): string {
  // ilike pattern wildcards we don't want a user to inject as control chars
  return s.replace(/[%_]/g, "\\$&");
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const title = q ? `Sök: ${q}` : "Sök";
  return {
    title,
    robots: { index: false, follow: true },
  };
}

export default async function SokPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: raw } = await searchParams;
  const q = (raw ?? "").trim();

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-20 md:pt-24 pb-16">
        <Container>
          <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-3">
            Sökresultat
          </p>
          <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight leading-none">
            {q ? `"${q}"` : "Sök på Moidello"}
          </h1>

          {!q ? (
            <p className="mt-8 text-foreground-muted">
              Sök efter kreatörer, märken eller outfits via förstoringsglaset
              i toppmenyn.
            </p>
          ) : (
            <SearchResults q={q} />
          )}
        </Container>
      </main>
    </>
  );
}

async function SearchResults({ q }: { q: string }) {
  const supabase = createPublicClient();
  const pattern = `%${escapeIlike(q)}%`;

  const [profilesRes, outfitsRes, brandsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, username, display_name, avatar_url, bio, account_type, brand_name",
      )
      .or(
        `username.ilike.${pattern},display_name.ilike.${pattern},brand_name.ilike.${pattern}`,
      )
      .limit(12),
    supabase
      .from("outfits")
      .select(
        "id, slug, title, image_url, description, profiles!outfits_user_id_fkey(username)",
      )
      .eq("is_published", true)
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(24),
    supabase
      .from("tagged_items")
      .select("brand")
      .ilike("brand", pattern)
      .limit(200),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileHit[];
  const outfits = (outfitsRes.data ?? []) as unknown as OutfitHit[];

  // Aggregate brand hits client-side to avoid running an extra distinct query.
  const brandCounts = new Map<string, number>();
  for (const r of (brandsRes.data ?? []) as Array<{ brand: string }>) {
    const k = r.brand;
    brandCounts.set(k, (brandCounts.get(k) ?? 0) + 1);
  }
  const brands: BrandHit[] = Array.from(brandCounts.entries())
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const empty =
    profiles.length === 0 && outfits.length === 0 && brands.length === 0;

  if (empty) {
    return (
      <div className="mt-16 text-center text-foreground-muted">
        <Search className="h-8 w-8 mx-auto mb-4 text-foreground-subtle" />
        <p>Inga träffar för &quot;{q}&quot;.</p>
        <p className="text-sm text-foreground-subtle mt-2">
          Försök med ett annat ord, eller bläddra på{" "}
          <Link href="/upptack" className="underline text-white">
            Upptäck
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-14">
      {profiles.length > 0 && (
        <section>
          <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-white mb-5">
            Kreatörer & märken
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {profiles.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/profile/${p.username}`}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-border hover:border-white/30 transition-colors"
                >
                  <UserAvatar
                    src={p.avatar_url ?? ""}
                    alt={p.display_name ?? p.username}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {p.display_name ?? p.brand_name ?? p.username}
                    </p>
                    <p className="text-xs text-foreground-subtle truncate">
                      {p.account_type === "brand" ? "Märke" : "Kreatör"} ·
                      @{p.username}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {brands.length > 0 && (
        <section>
          <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-white mb-5">
            Märken i taggade plagg
          </h2>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <Link
                key={b.brand}
                href={`/brand/${encodeURIComponent(b.brand.toLowerCase())}`}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-white hover:border-white/30 transition-colors"
              >
                {b.brand}
                <span className="text-xs text-foreground-subtle">
                  {b.count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {outfits.length > 0 && (
        <section>
          <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-white mb-5">
            Outfits
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {outfits.map((o) => (
              <Link
                key={o.id}
                href={outfitPathFromParts(
                  o.profiles?.username ?? "",
                  o.slug,
                  o.id,
                )}
                className="group block"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-background-tertiary">
                  <Image
                    src={o.image_url}
                    alt={o.title}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    unoptimized={o.image_url.startsWith("http")}
                  />
                </div>
                <p className="mt-2 text-sm text-white truncate">{o.title}</p>
                {o.profiles?.username && (
                  <p className="text-xs text-foreground-subtle truncate">
                    @{o.profiles.username}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
