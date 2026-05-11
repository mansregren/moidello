"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { Flag, Check, X, AlertCircle, ArrowRight } from "lucide-react";
import { setReportStatus } from "@/app/actions/admin";

export interface ReportRow {
  id: string;
  target_type: "outfit" | "comment" | "profile";
  target_id: string;
  reason: string;
  body: string | null;
  status: "open" | "reviewed" | "dismissed" | "actioned";
  created_at: string;
  reporter: { username: string; display_name: string | null } | null;
}

const REASON_LABEL: Record<string, string> = {
  spam: "Spam / vilseledande",
  harassment: "Trakasserier / hat",
  inappropriate: "Olämpligt innehåll",
  misinformation: "Felaktig information",
  impersonation: "Identitetsstöld",
  copyright: "Upphovsrätt",
  other: "Annat",
};

export function ReportsClient({
  reports,
  currentStatus,
}: {
  reports: ReportRow[];
  currentStatus: string;
}) {
  if (reports.length === 0) {
    return (
      <p className="mt-10 text-sm text-foreground-subtle">
        Inga anmälningar i kategorin {currentStatus}.
      </p>
    );
  }
  return (
    <ul className="mt-8 space-y-3">
      {reports.map((r) => (
        <ReportItem key={r.id} report={r} />
      ))}
    </ul>
  );
}

function ReportItem({ report }: { report: ReportRow }) {
  const [pending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const date = new Date(report.created_at).toLocaleString("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const targetUrl = buildTargetUrl(report);

  const act = (status: "dismissed" | "actioned" | "reviewed") => {
    setError(null);
    startTransition(async () => {
      const res = await setReportStatus(report.id, status);
      if (res.ok) {
        setHidden(true);
      } else {
        setError(res.error);
      }
    });
  };

  if (hidden) return null;

  return (
    <li className="rounded-2xl border border-border bg-background-secondary p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <Flag className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-foreground-subtle">
              {report.target_type}
            </span>
            <span className="text-sm font-medium text-white">
              {REASON_LABEL[report.reason] ?? report.reason}
            </span>
            <span className="text-xs text-foreground-subtle">
              {date} · av{" "}
              {report.reporter
                ? `@${report.reporter.username}`
                : "okänd"}
            </span>
          </div>

          {report.body && (
            <p className="mt-3 text-sm text-foreground-muted whitespace-pre-wrap">
              {report.body}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {targetUrl && (
              <Link
                href={targetUrl}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-full border border-border text-white px-3 py-1.5 text-xs hover:border-white/30"
              >
                Öppna {labelForTarget(report.target_type)}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
            {report.status === "open" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => act("reviewed")}
                className="inline-flex items-center gap-1.5 rounded-full border border-border text-white px-3 py-1.5 text-xs hover:border-white/30 disabled:opacity-50"
              >
                <AlertCircle className="h-3 w-3" />
                Markera granskad
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => act("dismissed")}
              className="inline-flex items-center gap-1.5 rounded-full border border-border text-foreground-muted px-3 py-1.5 text-xs hover:text-white hover:border-white/30 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
              Avvisa
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => act("actioned")}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1.5 text-xs hover:bg-red-500/30 disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
              Markera åtgärdad
            </button>
          </div>

          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </li>
  );
}

function buildTargetUrl(r: ReportRow): string | null {
  switch (r.target_type) {
    case "outfit":
      return `/outfit/${r.target_id}`;
    case "profile":
      // Profile target is the user-id, not a username, so we can't deep-link
      // directly. Linking via the admin URL is fine for now.
      return null;
    case "comment":
      return null;
  }
}

function labelForTarget(t: ReportRow["target_type"]): string {
  if (t === "outfit") return "outfit";
  if (t === "profile") return "profil";
  return "kommentar";
}
