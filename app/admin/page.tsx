import Link from "next/link";
import {
  Users,
  Layers,
  Tag as TagIcon,
  MessageCircle,
  MousePointerClick,
  Flag,
  ExternalLink,
  BarChart3,
  Search,
  Database,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PROJECT_SLUG = "cqarmynxrewurcbrrftn";

interface ReportPreview {
  id: string;
  target_type: "outfit" | "comment" | "profile";
  target_id: string;
  reason: string;
  body: string | null;
  created_at: string;
  reporter: { username: string; display_name: string | null } | null;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  const [
    usersTotal,
    brandsTotal,
    outfitsTotal,
    commentsTotal,
    clicks7d,
    reportsOpen,
    recentReports,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_type", "brand"),
    supabase
      .from("outfits")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase.from("comments").select("id", { count: "exact", head: true }),
    supabase
      .from("tag_clicks")
      .select("id", { count: "exact", head: true })
      .gte("clicked_at", sevenDaysAgoIso),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("reports")
      .select(
        `id, target_type, target_id, reason, body, created_at,
         reporter:profiles!reports_reporter_id_fkey(username, display_name)`,
      )
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const reports = (recentReports.data ?? []) as unknown as ReportPreview[];

  return (
    <>
      <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-3">
        Admin
      </p>
      <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight leading-none">
        Översikt
      </h1>
      <p className="mt-4 text-foreground-muted">
        Nyckeltal för hela plattformen + senaste anmälningarna. Externa
        verktyg (Vercel, Search Console, Supabase) länkas i botten.
      </p>

      <section className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          icon={Users}
          label="Användare"
          value={usersTotal.count ?? 0}
        />
        <StatCard
          icon={Layers}
          label="Märken"
          value={brandsTotal.count ?? 0}
        />
        <StatCard
          icon={TagIcon}
          label="Outfits"
          value={outfitsTotal.count ?? 0}
        />
        <StatCard
          icon={MessageCircle}
          label="Kommentarer"
          value={commentsTotal.count ?? 0}
        />
        <StatCard
          icon={MousePointerClick}
          label="Klick (7d)"
          value={clicks7d.count ?? 0}
        />
        <StatCard
          icon={Flag}
          label="Öppna anmälningar"
          value={reportsOpen.count ?? 0}
          highlight={(reportsOpen.count ?? 0) > 0}
        />
      </section>

      <section className="mt-14">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-foreground">
            Senaste anmälningar
          </h2>
          <Link
            href="/admin/anmalningar"
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            Alla →
          </Link>
        </div>
        {reports.length === 0 ? (
          <p className="text-sm text-foreground-subtle">
            Inga öppna anmälningar just nu.
          </p>
        ) : (
          <ul className="space-y-2">
            {reports.map((r) => (
              <ReportRow key={r.id} r={r} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14">
        <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-foreground mb-5">
          Externa verktyg
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ExternalCard
            icon={BarChart3}
            label="Vercel Analytics"
            description="Sidvyer, performance, demografi"
            href="https://vercel.com/dashboard"
          />
          <ExternalCard
            icon={Search}
            label="Google Search Console"
            description="SEO: impressions, klick, queries, indexering"
            href="https://search.google.com/search-console"
          />
          <ExternalCard
            icon={Database}
            label="Supabase Dashboard"
            description="DB, auth, storage, logs"
            href={`https://supabase.com/dashboard/project/${PROJECT_SLUG}`}
          />
        </div>
      </section>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-red-500/40 bg-red-500/[0.05]"
          : "border-border bg-background-secondary"
      }`}
    >
      <div className="flex items-center gap-2 mb-2 text-foreground-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl md:text-3xl font-semibold text-foreground tabular-nums">
        {value.toLocaleString("sv-SE")}
      </p>
    </div>
  );
}

function ReportRow({ r }: { r: ReportPreview }) {
  const date = new Date(r.created_at).toLocaleString("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <li className="rounded-xl border border-border bg-background-secondary p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground">
            <span className="text-foreground-muted uppercase tracking-wider text-[10px] mr-2">
              {r.target_type}
            </span>
            {r.reason}
          </p>
          {r.body && (
            <p className="mt-1 text-xs text-foreground-muted line-clamp-2">
              {r.body}
            </p>
          )}
          <p className="mt-1 text-[11px] text-foreground-subtle">
            {date} · av{" "}
            {r.reporter
              ? `@${r.reporter.username}`
              : "okänd"}{" "}
            · {r.target_id.slice(0, 8)}…
          </p>
        </div>
        <Link
          href="/admin/anmalningar"
          className="text-xs text-foreground-muted hover:text-foreground shrink-0"
        >
          Hantera →
        </Link>
      </div>
    </li>
  );
}

function ExternalCard({
  icon: Icon,
  label,
  description,
  href,
}: {
  icon: typeof BarChart3;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border border-border bg-background-secondary p-5 hover:border-foreground/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground inline-flex items-center gap-1.5">
            {label}
            <ExternalLink className="h-3 w-3 text-foreground-muted" />
          </p>
          <p className="mt-1 text-xs text-foreground-subtle">{description}</p>
        </div>
      </div>
    </a>
  );
}
