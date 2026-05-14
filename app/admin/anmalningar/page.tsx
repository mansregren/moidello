import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReportsClient, type ReportRow } from "./ReportsClient";

export const dynamic = "force-dynamic";

const STATUSES = ["open", "reviewed", "dismissed", "actioned"] as const;
type Status = (typeof STATUSES)[number];

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const status: Status = STATUSES.includes(rawStatus as Status)
    ? (rawStatus as Status)
    : "open";

  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select(
      `id, target_type, target_id, reason, body, status, created_at,
       reporter:profiles!reports_reporter_id_fkey(username, display_name)`,
    )
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);

  const reports = (data ?? []) as unknown as ReportRow[];

  return (
    <>
      <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-3">
        Admin / Anmälningar
      </p>
      <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight leading-none">
        Anmälningar
      </h1>
      <p className="mt-4 text-foreground-muted">
        Filtrera och hantera anmälningar från användarna.
      </p>

      <nav className="mt-8 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/anmalningar?status=${s}`}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
              s === status
                ? "bg-foreground text-background border-foreground"
                : "border-border text-foreground-muted hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {labelFor(s)}
          </Link>
        ))}
      </nav>

      <ReportsClient reports={reports} currentStatus={status} />
    </>
  );
}

function labelFor(s: Status): string {
  switch (s) {
    case "open":
      return "Öppna";
    case "reviewed":
      return "Granskade";
    case "dismissed":
      return "Avvisade";
    case "actioned":
      return "Åtgärdade";
  }
}
