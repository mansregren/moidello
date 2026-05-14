import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Eye, Heart, Bookmark, MessageCircle, MousePointerClick } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface EngagementRow {
  outfit_id: string;
  user_id: string;
  title: string;
  image_url: string;
  created_at: string;
  views: number;
  unique_views: number;
  likes: number;
  saves: number;
  comments: number;
  clicks: number;
}

export default async function StatistikPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("outfit_engagement")
    .select(
      "outfit_id, user_id, title, image_url, created_at, views, unique_views, likes, saves, comments, clicks",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 42P01 = relation does not exist (migration not yet applied).
  const rows = (error?.code === "42P01" ? [] : (data ?? [])) as EngagementRow[];

  const totals = rows.reduce(
    (acc, r) => ({
      views: acc.views + r.views,
      unique_views: acc.unique_views + r.unique_views,
      likes: acc.likes + r.likes,
      saves: acc.saves + r.saves,
      comments: acc.comments + r.comments,
      clicks: acc.clicks + r.clicks,
    }),
    { views: 0, unique_views: 0, likes: 0, saves: 0, comments: 0, clicks: 0 },
  );

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-6 md:pt-10">
        <Container>
          <Link
            href="/profil"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till profilen
          </Link>

          <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
            Statistik
          </h1>
          <p className="mt-3 text-foreground-muted">
            Hur dina outfits presterar.
          </p>

          {/* Totals */}
          <section className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <SummaryCard icon={Eye} label="Visningar" value={totals.views} sub={`${totals.unique_views} unika`} />
            <SummaryCard icon={Heart} label="Gillningar" value={totals.likes} />
            <SummaryCard icon={Bookmark} label="Sparade" value={totals.saves} />
            <SummaryCard icon={MessageCircle} label="Kommentarer" value={totals.comments} />
            <SummaryCard icon={MousePointerClick} label="Klick på köplänk" value={totals.clicks} />
            <SummaryCard
              label="Outfits"
              value={rows.length}
              icon={Heart}
              showIcon={false}
            />
          </section>

          {/* Per-outfit table */}
          <section className="mt-12">
            <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-foreground mb-5">
              Per outfit
            </h2>

            {error && error.code === "42P01" && (
              <p className="text-sm text-amber-400">
                Tabellen finns inte ännu. Kör migration 0005_views_clicks.sql i Supabase.
              </p>
            )}

            {rows.length === 0 && !error && (
              <p className="text-sm text-foreground-muted">
                Du har inte lagt upp någon outfit än, eller så har ingen sett
                dina ännu. Statistik dyker upp här när folk börjar interagera.
              </p>
            )}

            {rows.length > 0 && (
              <div className="overflow-x-auto -mx-6 md:-mx-12 px-6 md:px-12">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left font-medium text-foreground-muted py-3 pr-4">Outfit</th>
                      <th className="text-right font-medium text-foreground-muted py-3 px-2"><Eye className="h-3.5 w-3.5 inline mb-0.5 mr-1" />Visn.</th>
                      <th className="text-right font-medium text-foreground-muted py-3 px-2">Unika</th>
                      <th className="text-right font-medium text-foreground-muted py-3 px-2"><Heart className="h-3.5 w-3.5 inline mb-0.5 mr-1" />Gillas</th>
                      <th className="text-right font-medium text-foreground-muted py-3 px-2"><Bookmark className="h-3.5 w-3.5 inline mb-0.5 mr-1" />Sparas</th>
                      <th className="text-right font-medium text-foreground-muted py-3 px-2"><MessageCircle className="h-3.5 w-3.5 inline mb-0.5 mr-1" />Komm.</th>
                      <th className="text-right font-medium text-foreground-muted py-3 px-2"><MousePointerClick className="h-3.5 w-3.5 inline mb-0.5 mr-1" />Klick</th>
                      <th className="text-right font-medium text-foreground-muted py-3 pl-2">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const ctr = r.unique_views > 0
                        ? (r.clicks / r.unique_views) * 100
                        : 0;
                      return (
                        <tr key={r.outfit_id} className="border-b border-border last:border-0">
                          <td className="py-3 pr-4">
                            <Link
                              href={`/outfit/${r.outfit_id}`}
                              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
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
                                <p className="text-foreground font-medium truncate max-w-[18rem]">
                                  {r.title}
                                </p>
                                <p className="text-xs text-foreground-subtle">
                                  {new Date(r.created_at).toLocaleDateString("sv-SE")}
                                </p>
                              </div>
                            </Link>
                          </td>
                          <td className="text-right tabular-nums text-foreground py-3 px-2">{r.views}</td>
                          <td className="text-right tabular-nums text-foreground-muted py-3 px-2">{r.unique_views}</td>
                          <td className="text-right tabular-nums text-foreground py-3 px-2">{r.likes}</td>
                          <td className="text-right tabular-nums text-foreground py-3 px-2">{r.saves}</td>
                          <td className="text-right tabular-nums text-foreground py-3 px-2">{r.comments}</td>
                          <td className="text-right tabular-nums text-foreground py-3 px-2">{r.clicks}</td>
                          <td className="text-right tabular-nums text-foreground-muted py-3 pl-2">
                            {ctr.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="py-16" />
        </Container>
      </main>
    </>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  showIcon = true,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  sub?: string;
  showIcon?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background-secondary p-4">
      <div className="flex items-center gap-2 text-foreground-muted">
        {showIcon && <Icon className="h-3.5 w-3.5" />}
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 font-heading text-3xl uppercase text-foreground tabular-nums">
        {value.toLocaleString("sv-SE")}
      </p>
      {sub && <p className="mt-1 text-xs text-foreground-subtle">{sub}</p>}
    </div>
  );
}
