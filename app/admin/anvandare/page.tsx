import { createClient } from "@/lib/supabase/server";
import { UsersClient, type UserRow } from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, bio, account_type, brand_name, is_admin, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (q?.trim()) {
    const pattern = `%${q.trim().replace(/[%_]/g, "\\$&")}%`;
    query = query.or(
      `username.ilike.${pattern},display_name.ilike.${pattern},brand_name.ilike.${pattern}`,
    );
  }

  const { data } = await query;
  const users = (data ?? []) as unknown as UserRow[];

  // Fetch outfit counts per user in one round-trip.
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
        Posta som en användare, växla admin-status eller radera ett konto.
        Demo-kreatörer kan seedas med en knapp.
      </p>

      <UsersClient
        users={users}
        outfitCounts={Object.fromEntries(counts)}
        viewerId={viewer?.id ?? null}
        initialQuery={q ?? ""}
      />
    </>
  );
}
