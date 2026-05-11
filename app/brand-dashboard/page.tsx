import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, Bookmark, MessageCircle, MousePointerClick, Globe } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface DashboardRow {
  brand_profile_id: string;
  brand_key: string;
  outfit_id: string;
  creator_id: string;
  title: string;
  image_url: string;
  created_at: string;
  likes: number;
  saves: number;
  comments: number;
  brand_clicks: number;
}

interface BrandProfile {
  id: string;
  account_type: "creator" | "brand";
  brand_name: string | null;
  brand_website: string | null;
}

export default async function BrandDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, account_type, brand_name, brand_website")
    .eq("id", user.id)
    .maybeSingle();

  // Migration not yet applied
  if (profileError?.code === "42703" || profileError?.code === "42P01") {
    return (
      <Shell>
        <p className="text-sm text-amber-400">
          account_type-kolumnen finns inte ännu. Kör migration
          0007_account_types.sql i Supabase.
        </p>
      </Shell>
    );
  }

  const profile = profileData as BrandProfile | null;
  if (!profile || profile.account_type !== "brand" || !profile.brand_name) {
    return (
      <Shell>
        <p className="text-foreground-muted">
          Du har inte aktiverat ett brand-konto. Gå till{" "}
          <Link href="/profil" className="text-white underline hover:text-white/80">
            din profil
          </Link>{" "}
          och kryssa i &quot;Jag representerar ett märke&quot; för att komma
          igång.
        </p>
      </Shell>
    );
  }

  const { data, error } = await supabase
    .from("brand_dashboard")
    .select(
      "brand_profile_id, brand_key, outfit_id, creator_id, title, image_url, created_at, likes, saves, comments, brand_clicks",
    )
    .eq("brand_profile_id", profile.id)
    .order("created_at", { ascending: false });

  const rows = (error?.code === "42P01" ? [] : (data ?? [])) as DashboardRow[];

  const totals = rows.reduce(
    (acc, r) => ({
      likes: acc.likes + r.likes,
      saves: acc.saves + r.saves,
      comments: acc.comments + r.comments,
      clicks: acc.clicks + r.brand_clicks,
    }),
    { likes: 0, saves: 0, comments: 0, clicks: 0 },
  );

  return (
    <Shell>
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex rounded-full bg-white text-black px-3 py-1 text-[11px] uppercase tracking-wider font-semibold">
          Brand
        </span>
        {profile.brand_website && (
          <a
            href={profile.brand_website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-white"
          >
            <Globe className="h-3 w-3" />
            {profile.brand_website.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>

      <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
        {profile.brand_name}
      </h1>
      <p className="mt-3 text-foreground-muted">
        Engagemang på outfits där kreatörer har taggat ditt märke.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/brand-dashboard/import"
          className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-xs font-semibold hover:bg-white/90"
        >
          Importera produkter (CSV)
        </Link>
      </div>

      <section className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard icon={Heart} label="Gillningar" value={totals.likes} />
        <SummaryCard icon={Bookmark} label="Sparade" value={totals.saves} />
        <SummaryCard icon={MessageCircle} label="Kommentarer" value={totals.comments} />
        <SummaryCard icon={MousePointerClick} label="Klick på köplänk" value={totals.clicks} />
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-white mb-5">
          Outfits som taggar {profile.brand_name}
        </h2>

        {rows.length === 0 && (
          <p className="text-sm text-foreground-muted">
            Inga outfits taggar ditt märke ännu. Statistik dyker upp här när
            kreatörer börjar tagga.
          </p>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto -mx-6 md:-mx-12 px-6 md:px-12">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-foreground-muted py-3 pr-4">Outfit</th>
                  <th className="text-right font-medium text-foreground-muted py-3 px-2">
                    <Heart className="h-3.5 w-3.5 inline mb-0.5 mr-1" />
                    Gillas
                  </th>
                  <th className="text-right font-medium text-foreground-muted py-3 px-2">
                    <Bookmark className="h-3.5 w-3.5 inline mb-0.5 mr-1" />
                    Sparas
                  </th>
                  <th className="text-right font-medium text-foreground-muted py-3 px-2">
                    <MessageCircle className="h-3.5 w-3.5 inline mb-0.5 mr-1" />
                    Komm.
                  </th>
                  <th className="text-right font-medium text-foreground-muted py-3 pl-2">
                    <MousePointerClick className="h-3.5 w-3.5 inline mb-0.5 mr-1" />
                    Klick
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.outfit_id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/outfit/${r.outfit_id}`}
                        className="flex items-center gap-3 hover:opacity-90"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-background-tertiary">
                          <Image
                            src={r.image_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized={r.image_url.startsWith("http")}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate max-w-[18rem]">
                            {r.title}
                          </p>
                          <p className="text-xs text-foreground-subtle">
                            {new Date(r.created_at).toLocaleDateString("sv-SE")}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="text-right tabular-nums text-white py-3 px-2">{r.likes}</td>
                    <td className="text-right tabular-nums text-white py-3 px-2">{r.saves}</td>
                    <td className="text-right tabular-nums text-white py-3 px-2">{r.comments}</td>
                    <td className="text-right tabular-nums text-white py-3 pl-2">{r.brand_clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="py-16" />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-6 md:pt-10">
        <Container>
          <Link
            href="/profil"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till profilen
          </Link>
          {children}
        </Container>
      </main>
    </>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Heart;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background-secondary p-4">
      <div className="flex items-center gap-2 text-foreground-muted">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 font-heading text-3xl uppercase text-white tabular-nums">
        {value.toLocaleString("sv-SE")}
      </p>
    </div>
  );
}
