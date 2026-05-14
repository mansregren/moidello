import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UsersClient, type UserRow } from "./UsersClient";

export const dynamic = "force-dynamic";

const FILTERS = ["all", "real", "demo", "brand", "admin"] as const;
type Filter = (typeof FILTERS)[number];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q, filter: rawFilter } = await searchParams;
  const filter: Filter = FILTERS.includes(rawFilter as Filter)
    ? (rawFilter as Filter)
    : "all";

  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, bio, account_type, brand_name, is_admin, is_demo, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (filter === "real") query = query.eq("is_demo", false);
  else if (filter === "demo") query = query.eq("is_demo", true);
  else if (filter === "brand") query = query.eq("account_type", "brand");
  else if (filter === "admin") query = query.eq("is_admin", true);

  if (q?.trim()) {
    const pattern = `%${q.trim().replace(/[%_]/g, "\\$&")}%`;
    query = query.or(
      `username.ilike.${pattern},display_name.ilike.${pattern},brand_name.ilike.${pattern}`,
    );
  }

  const { data } = await query;
  const users = (data ?? []) as unknown as UserRow[];

  const ids = users.map((u) => u.id);
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: rows } = await supabase
      .from("outfits")
      .select("user_id")
      .in("user_id", ids);
    for (const r of (rows ?? []) as Array<{ user_id: string }>) {
      counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1);
    }
  }

  return (
    <>
      <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-3">
        Admin / Användare
      </p>
      <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight leading-none">
        Användare
      </h1>
      <p className="mt-4 text-foreground-muted">
        Hantera profiler, byt bild, posta som någon eller skapa nya
        demo-konton.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <FilterPill key={f} f={f} current={filter} q={q} />
        ))}
      </nav>

      <UsersClient
        users={users}
        outfitCounts={Object.fromEntries(counts)}
        viewerId={viewer?.id ?? null}
        initialQuery={q ?? ""}
        currentFilter={filter}
      />
    </>
  );
}

function FilterPill({
  f,
  current,
  q,
}: {
  f: Filter;
  current: Filter;
  q?: string;
}) {
  const qs = new URLSearchParams();
  if (f !== "all") qs.set("filter", f);
  if (q) qs.set("q", q);
  const href = `/admin/anvandare${qs.toString() ? "?" + qs.toString() : ""}`;

  const labels: Record<Filter, string> = {
    all: "Alla",
    real: "Riktiga",
    demo: "Demo",
    brand: "Märken",
    admin: "Admins",
  };

  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
        f === current
          ? "bg-foreground text-background border-foreground"
          : "border-border text-foreground-muted hover:text-foreground hover:border-foreground/30"
      }`}
    >
      {labels[f]}
    </Link>
  );
}
