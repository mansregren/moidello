import Image from "next/image";
import Link from "next/link";
import {
  Eye,
  Heart,
  Bookmark,
  MousePointerClick,
  Users,
  TrendingUp,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface OutfitStat {
  outfit_id: string;
  title: string;
  image_url: string;
  user_id: string;
  views: number;
  unique_views: number;
  likes: number;
  saves: number;
  comments: number;
  clicks: number;
}

interface ProfileLite {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_demo: boolean;
}

interface CreatorStat {
  profile_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_demo: boolean;
  followers: number;
  outfits: number;
}

interface BrandStat {
  brand: string;
  clicks: number;
}

const TOP = 10;
const DAYS = 30;

export default async function AdminStatsPage() {
  const supabase = await createClient();

  const sinceIso = new Date(
    Date.now() - DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Top outfits across each metric. We pull engagement once then re-sort
  // in memory rather than 4 separate queries.
  const { data: engagementRaw } = await supabase
    .from("outfit_engagement")
    .select(
      "outfit_id, title, image_url, user_id, views, unique_views, likes, saves, comments, clicks",
    )
    .limit(500);

  const engagement = (engagementRaw ?? []) as OutfitStat[];

  const topByViews = [...engagement]
    .sort((a, b) => b.views - a.views)
    .slice(0, TOP);
  const topByClicks = [...engagement]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, TOP);
  const topByLikes = [...engagement]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, TOP);
  const topBySaves = [...engagement]
    .sort((a, b) => b.saves - a.saves)
    .slice(0, TOP);

  const allOutfitIds = new Set<string>([
    ...topByViews.map((o) => o.outfit_id),
    ...topByClicks.map((o) => o.outfit_id),
    ...topByLikes.map((o) => o.outfit_id),
    ...topBySaves.map((o) => o.outfit_id),
  ]);
  const allUserIds = new Set<string>(
    engagement
      .filter((e) => allOutfitIds.has(e.outfit_id))
      .map((e) => e.user_id),
  );

  // Top creators by followers.
  const { data: creatorStats } = await supabase
    .from("profile_stats")
    .select("profile_id, followers, outfits")
    .order("followers", { ascending: false })
    .limit(TOP);

  const creatorIds = new Set(
    (creatorStats ?? []).map(
      (c) => c.profile_id as string,
    ),
  );
  for (const id of creatorIds) allUserIds.add(id);

  // Resolve all profiles in one query.
  const profileMap = new Map<string, ProfileLite>();
  if (allUserIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_demo")
      .in("id", Array.from(allUserIds));
    for (const p of (profiles ?? []) as ProfileLite[]) {
      profileMap.set(p.id, p);
    }
  }

  const topCreators: CreatorStat[] = (
    (creatorStats ?? []) as Array<{
      profile_id: string;
      followers: number;
      outfits: number;
    }>
  )
    .map((c) => {
      const p = profileMap.get(c.profile_id);
      if (!p) return null;
      return {
        profile_id: c.profile_id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        is_demo: p.is_demo,
        followers: c.followers,
        outfits: c.outfits,
      } satisfies CreatorStat;
    })
    .filter((c): c is CreatorStat => c !== null);

  // Top brands by click count: pull tag_clicks last 90 days + join tags.
  const ninetyDaysAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: brandClicks } = await supabase
    .from("tag_clicks")
    .select("tag_id, tagged_items!inner(brand)")
    .gte("clicked_at", ninetyDaysAgo)
    .limit(5000);

  const brandCounts = new Map<string, number>();
  for (const r of ((brandClicks ?? []) as unknown as Array<{
    tagged_items: { brand: string } | null;
  }>) ?? []) {
    const b = r.tagged_items?.brand;
    if (!b) continue;
    brandCounts.set(b, (brandCounts.get(b) ?? 0) + 1);
  }
  const topBrands: BrandStat[] = Array.from(brandCounts.entries())
    .map(([brand, clicks]) => ({ brand, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, TOP);

  // Daily activity counts for the last 30 days.
  const [signups30, outfits30, clicks30, views30] = await Promise.all([
    supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", sinceIso),
    supabase
      .from("outfits")
      .select("created_at")
      .gte("created_at", sinceIso),
    supabase
      .from("tag_clicks")
      .select("clicked_at")
      .gte("clicked_at", sinceIso),
    supabase
      .from("outfit_views")
      .select("viewed_at")
      .gte("viewed_at", sinceIso),
  ]);

  const dailySignups = bucketByDay(
    (signups30.data ?? []) as Array<{ created_at: string }>,
    "created_at",
  );
  const dailyOutfits = bucketByDay(
    (outfits30.data ?? []) as Array<{ created_at: string }>,
    "created_at",
  );
  const dailyClicks = bucketByDay(
    (clicks30.data ?? []) as Array<{ clicked_at: string }>,
    "clicked_at",
  );
  const dailyViews = bucketByDay(
    (views30.data ?? []) as Array<{ viewed_at: string }>,
    "viewed_at",
  );

  return (
    <Container className="max-w-6xl">
      <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-3">
        Admin / Statistik
      </p>
      <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight leading-none">
        Statistik
      </h1>
      <p className="mt-4 text-foreground-muted">
        Toppinlägg, kreatörer och märken. Aktivitet senaste {DAYS} dagar.
      </p>

      {/* Daily activity */}
      <section className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Sparkline
          icon={Users}
          label="Nya konton"
          daily={dailySignups}
          color="emerald"
        />
        <Sparkline
          icon={TrendingUp}
          label="Nya outfits"
          daily={dailyOutfits}
          color="sky"
        />
        <Sparkline
          icon={Eye}
          label="Visningar"
          daily={dailyViews}
          color="violet"
        />
        <Sparkline
          icon={MousePointerClick}
          label="Köp-klick"
          daily={dailyClicks}
          color="amber"
        />
      </section>

      <div className="grid lg:grid-cols-2 gap-8 mt-14">
        <OutfitTopList
          title="Mest visade"
          icon={Eye}
          rows={topByViews}
          metric={(o) => o.views}
          profileMap={profileMap}
        />
        <OutfitTopList
          title="Mest klick"
          icon={MousePointerClick}
          rows={topByClicks}
          metric={(o) => o.clicks}
          profileMap={profileMap}
        />
        <OutfitTopList
          title="Mest gillade"
          icon={Heart}
          rows={topByLikes}
          metric={(o) => o.likes}
          profileMap={profileMap}
        />
        <OutfitTopList
          title="Mest sparade"
          icon={Bookmark}
          rows={topBySaves}
          metric={(o) => o.saves}
          profileMap={profileMap}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mt-14">
        <section>
          <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-5">
            Topp kreatörer
          </h2>
          <ul className="space-y-2">
            {topCreators.length === 0 && (
              <p className="text-sm text-foreground-subtle">
                Inga kreatörer med följare än.
              </p>
            )}
            {topCreators.map((c, i) => (
              <li
                key={c.profile_id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background-secondary"
              >
                <span className="w-6 text-center text-sm text-foreground-subtle tabular-nums">
                  {i + 1}
                </span>
                <Link
                  href={`/admin/anvandare/${c.profile_id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-background-tertiary border border-border">
                    {c.avatar_url && (
                      <Image
                        src={c.avatar_url}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized={c.avatar_url.startsWith("http")}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {c.display_name ?? c.username}
                      {c.is_demo && (
                        <span className="ml-2 inline-flex rounded-full bg-amber-500/20 text-amber-300 px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
                          Demo
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-foreground-subtle">
                      {c.outfits} outfits
                    </p>
                  </div>
                </Link>
                <p className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
                  {c.followers.toLocaleString("sv-SE")}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-5">
            Topp märken (klick, 90d)
          </h2>
          <ul className="space-y-2">
            {topBrands.length === 0 && (
              <p className="text-sm text-foreground-subtle">
                Inga klick på taggade plagg ännu.
              </p>
            )}
            {topBrands.map((b, i) => (
              <li
                key={b.brand}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background-secondary"
              >
                <span className="w-6 text-center text-sm text-foreground-subtle tabular-nums">
                  {i + 1}
                </span>
                <Link
                  href={`/brand/${encodeURIComponent(b.brand.toLowerCase())}`}
                  target="_blank"
                  className="flex-1 min-w-0 text-sm font-medium text-foreground truncate hover:underline"
                >
                  {b.brand}
                </Link>
                <p className="shrink-0 text-sm font-semibold text-foreground tabular-nums inline-flex items-center gap-1.5">
                  <MousePointerClick className="h-3 w-3 text-foreground-muted" />
                  {b.clicks.toLocaleString("sv-SE")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Container>
  );
}

function OutfitTopList({
  title,
  icon: Icon,
  rows,
  metric,
  profileMap,
}: {
  title: string;
  icon: typeof Eye;
  rows: OutfitStat[];
  metric: (o: OutfitStat) => number;
  profileMap: Map<string, ProfileLite>;
}) {
  return (
    <section>
      <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground mb-5 inline-flex items-center gap-2">
        <Icon className="h-5 w-5" />
        {title}
      </h2>
      <ul className="space-y-2">
        {rows.length === 0 && (
          <p className="text-sm text-foreground-subtle">Inga data ännu.</p>
        )}
        {rows.map((o, i) => {
          const c = profileMap.get(o.user_id);
          return (
            <li
              key={o.outfit_id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background-secondary"
            >
              <span className="w-6 text-center text-sm text-foreground-subtle tabular-nums">
                {i + 1}
              </span>
              <Link
                href={`/admin/inlagg/${o.outfit_id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="relative h-12 w-10 shrink-0 rounded-md overflow-hidden bg-background-tertiary">
                  <Image
                    src={o.image_url}
                    alt={o.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                    unoptimized={o.image_url.startsWith("http")}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{o.title}</p>
                  <p className="text-xs text-foreground-subtle truncate">
                    @{c?.username ?? "?"}
                  </p>
                </div>
              </Link>
              <p className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
                {metric(o).toLocaleString("sv-SE")}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function bucketByDay<T extends Record<string, unknown>>(
  rows: T[],
  field: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const ts = r[field] as string | undefined;
    if (!ts) continue;
    const key = ts.slice(0, 10);
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

const COLOR_CLASSES: Record<string, { line: string; text: string }> = {
  emerald: { line: "bg-emerald-400", text: "text-emerald-300" },
  sky: { line: "bg-sky-400", text: "text-sky-300" },
  violet: { line: "bg-violet-400", text: "text-violet-300" },
  amber: { line: "bg-amber-400", text: "text-amber-300" },
};

function Sparkline({
  icon: Icon,
  label,
  daily,
  color,
}: {
  icon: typeof Eye;
  label: string;
  daily: Record<string, number>;
  color: string;
}) {
  const days = DAYS;
  const buckets: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.push(daily[key] ?? 0);
  }
  const total = buckets.reduce((a, b) => a + b, 0);
  const max = Math.max(...buckets, 1);
  const colors = COLOR_CLASSES[color] ?? COLOR_CLASSES.emerald;

  return (
    <div className="rounded-2xl border border-border bg-background-secondary p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-foreground-muted">
          <Icon className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider">{label}</span>
        </div>
        <p className={`text-xl font-semibold tabular-nums ${colors.text}`}>
          {total.toLocaleString("sv-SE")}
        </p>
      </div>
      <div className="flex items-end gap-[2px] h-12">
        {buckets.map((v, i) => {
          const heightPct = (v / max) * 100;
          return (
            <div
              key={i}
              className={`flex-1 ${colors.line} rounded-sm opacity-70`}
              style={{ height: `${Math.max(heightPct, 3)}%` }}
              title={`${v} st`}
            />
          );
        })}
      </div>
    </div>
  );
}
