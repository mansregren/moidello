import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, Bookmark, MousePointerClick, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SORTS = ["created_at", "views", "likes", "saves", "clicks", "comments"] as const;
type Sort = (typeof SORTS)[number];

interface OutfitRow {
  outfit_id: string;
  title: string;
  image_url: string;
  user_id: string;
  created_at: string;
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
  is_demo: boolean;
}

export default async function AdminInlaggPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const { sort: rawSort, q } = await searchParams;
  const sort: Sort = SORTS.includes(rawSort as Sort)
    ? (rawSort as Sort)
    : "created_at";

  const supabase = await createClient();

  // outfit_engagement has owner-only RLS, but admins can read all via the
  // admin policies + invoker view from 0021. We pull everything and let
  // the engagement view do the joining for us.
  const { data: rows } = await supabase
    .from("outfit_engagement")
    .select(
      "outfit_id, title, image_url, user_id, created_at, views, unique_views, likes, saves, comments, clicks",
    )
    .order(sort, { ascending: false })
    .limit(200);

  let outfits = (rows ?? []) as unknown as OutfitRow[];

  // Optional title search filters client-side over what we already pulled.
  if (q?.trim()) {
    const term = q.trim().toLowerCase();
    outfits = outfits.filter((o) =>
      o.title.toLowerCase().includes(term),
    );
  }

  // Resolve creators in one round-trip.
  const profileMap = new Map<string, ProfileLite>();
  const userIds = Array.from(new Set(outfits.map((o) => o.user_id)));
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, is_demo")
      .in("id", userIds);
    for (const p of (profiles ?? []) as ProfileLite[]) {
      profileMap.set(p.id, p);
    }
  }

  return (
    <>
      <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-3">
        Admin / Inlägg
      </p>
      <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight leading-none">
        Alla inlägg
      </h1>
      <p className="mt-4 text-foreground-muted">
        {outfits.length} outfits totalt. Sortera på vad du vill optimera —
        visningar, klick, sparade.
      </p>

      <nav className="mt-8 flex flex-wrap gap-2">
        <SortPill s="created_at" label="Senaste" current={sort} q={q} />
        <SortPill s="views" label="Mest visade" current={sort} q={q} />
        <SortPill s="clicks" label="Mest klick" current={sort} q={q} />
        <SortPill s="likes" label="Mest gillade" current={sort} q={q} />
        <SortPill s="saves" label="Mest sparade" current={sort} q={q} />
        <SortPill
          s="comments"
          label="Mest kommentarer"
          current={sort}
          q={q}
        />
      </nav>

      <ul className="mt-8 space-y-2">
        {outfits.length === 0 && (
          <p className="text-sm text-foreground-subtle">
            Inga inlägg matchar.
          </p>
        )}
        {outfits.map((o) => {
          const creator = profileMap.get(o.user_id);
          return (
            <li key={o.outfit_id}>
              <Link
                href={`/admin/inlagg/${o.outfit_id}`}
                className="flex items-center gap-4 p-3 rounded-2xl border border-border bg-background-secondary hover:border-white/30 transition-colors"
              >
                <div className="relative h-20 w-16 shrink-0 rounded-lg overflow-hidden bg-background-tertiary">
                  <Image
                    src={o.image_url}
                    alt={o.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized={o.image_url.startsWith("http")}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {o.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-subtle mt-0.5">
                    {creator && (
                      <span className="truncate">
                        @{creator.username}
                        {creator.is_demo && (
                          <span className="ml-1 inline-flex rounded-full bg-amber-500/20 text-amber-300 px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
                            Demo
                          </span>
                        )}
                      </span>
                    )}
                    <span>
                      {new Date(o.created_at).toLocaleDateString("sv-SE")}
                    </span>
                  </div>
                </div>
                <div className="hidden md:flex shrink-0 items-center gap-4 text-xs text-foreground-muted tabular-nums">
                  <StatPill icon={Eye} value={o.views} />
                  <StatPill icon={MousePointerClick} value={o.clicks} />
                  <StatPill icon={Heart} value={o.likes} />
                  <StatPill icon={Bookmark} value={o.saves} />
                  <StatPill icon={MessageCircle} value={o.comments} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function SortPill({
  s,
  label,
  current,
  q,
}: {
  s: Sort;
  label: string;
  current: Sort;
  q?: string;
}) {
  const params = new URLSearchParams();
  if (s !== "created_at") params.set("sort", s);
  if (q) params.set("q", q);
  const href = `/admin/inlagg${params.toString() ? "?" + params.toString() : ""}`;

  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
        s === current
          ? "bg-white text-black border-white"
          : "border-border text-foreground-muted hover:text-white hover:border-white/30"
      }`}
    >
      {label}
    </Link>
  );
}

function StatPill({
  icon: Icon,
  value,
}: {
  icon: typeof Eye;
  value: number;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {value.toLocaleString("sv-SE")}
    </span>
  );
}
