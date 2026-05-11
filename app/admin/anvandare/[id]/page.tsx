import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Heart,
  Bookmark,
  MessageCircle,
  MousePointerClick,
  Users,
  Calendar,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";
import { UserDetailClient, type FullUserRow } from "./UserDetailClient";
import { outfitPathFromParts } from "@/lib/outfit-url";

export const dynamic = "force-dynamic";

interface OutfitSummary {
  id: string;
  slug: string | null;
  title: string;
  image_url: string;
  is_published: boolean;
  created_at: string;
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, bio, region, account_type, brand_name, brand_website, instagram, tiktok, youtube, website, contact_email, is_admin, is_demo, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!profile) notFound();

  const user = profile as unknown as FullUserRow;

  const { data: outfitsRaw } = await supabase
    .from("outfits")
    .select("id, slug, title, image_url, is_published, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const outfits = (outfitsRaw ?? []) as OutfitSummary[];

  // Aggregate stats across all of this user's outfits.
  const outfitIds = outfits.map((o) => o.id);
  let totals = {
    views: 0,
    unique_views: 0,
    likes: 0,
    saves: 0,
    comments: 0,
    clicks: 0,
  };
  let followers = 0;
  let following = 0;

  if (outfitIds.length > 0) {
    const { data: engagement } = await supabase
      .from("outfit_engagement")
      .select("views, unique_views, likes, saves, comments, clicks")
      .in("outfit_id", outfitIds);

    for (const row of (engagement ?? []) as Array<typeof totals>) {
      totals.views += row.views ?? 0;
      totals.unique_views += row.unique_views ?? 0;
      totals.likes += row.likes ?? 0;
      totals.saves += row.saves ?? 0;
      totals.comments += row.comments ?? 0;
      totals.clicks += row.clicks ?? 0;
    }
  }

  const { data: stats } = await supabase
    .from("profile_stats")
    .select("followers, following")
    .eq("profile_id", id)
    .maybeSingle();
  if (stats) {
    followers = (stats.followers as number) ?? 0;
    following = (stats.following as number) ?? 0;
  }

  const memberSince = new Date(user.created_at).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Container className="max-w-5xl">
      <Link
        href="/admin/anvandare"
        className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Alla användare
      </Link>

      <div className="flex items-start gap-6 mb-10">
        <div className="relative h-24 w-24 sm:h-32 sm:w-32 shrink-0 rounded-full overflow-hidden border border-border bg-background-tertiary">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
              unoptimized={user.avatar_url.startsWith("http")}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-foreground-subtle text-2xl">
              {(user.display_name ?? user.username).slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {user.is_admin && (
              <span className="inline-flex rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                Admin
              </span>
            )}
            {user.is_demo && (
              <span className="inline-flex rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                Demo
              </span>
            )}
            {user.account_type === "brand" && (
              <span className="inline-flex rounded-full bg-white/10 text-white px-2 py-0.5 text-[10px] uppercase tracking-wider">
                Märke
              </span>
            )}
          </div>
          <h1 className="font-heading text-3xl md:text-5xl uppercase tracking-tight text-white leading-none">
            {user.display_name ?? user.username}
          </h1>
          <p className="text-sm text-foreground-subtle mt-1">
            <Link
              href={`/profile/${user.username}`}
              target="_blank"
              className="hover:text-white"
            >
              @{user.username} →
            </Link>
          </p>
          {user.bio && (
            <p className="text-sm text-foreground-muted mt-3 max-w-xl">
              {user.bio}
            </p>
          )}
          <p className="text-xs text-foreground-subtle mt-3 inline-flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Medlem sedan {memberSince}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <Stat icon={Users} label="Följare" value={followers} />
        <Stat icon={Users} label="Följer" value={following} />
        <Stat icon={Eye} label="Visningar" value={totals.views} />
        <Stat
          icon={Eye}
          label="Unika visningar"
          value={totals.unique_views}
        />
        <Stat icon={Heart} label="Gillningar" value={totals.likes} />
        <Stat icon={Bookmark} label="Sparade" value={totals.saves} />
        <Stat
          icon={MessageCircle}
          label="Kommentarer"
          value={totals.comments}
        />
        <Stat
          icon={MousePointerClick}
          label="Köp-klick"
          value={totals.clicks}
        />
      </section>

      {/* Edit form (client) */}
      <UserDetailClient user={user} />

      {/* Outfit grid */}
      <section className="mt-14">
        <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-white mb-5">
          Inlägg ({outfits.length})
        </h2>
        {outfits.length === 0 ? (
          <p className="text-sm text-foreground-subtle">
            Inga inlägg ännu.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {outfits.map((o) => (
              <Link
                key={o.id}
                href={`/admin/inlagg/${o.id}`}
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
                  {!o.is_published && (
                    <span className="absolute top-2 left-2 inline-flex rounded-full bg-amber-500/80 text-black px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold">
                      Utkast
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-white truncate">{o.title}</p>
                <p className="text-xs text-foreground-subtle">
                  {new Date(o.created_at).toLocaleDateString("sv-SE")}
                  {" · "}
                  <Link
                    href={outfitPathFromParts(user.username, o.slug, o.id)}
                    target="_blank"
                    className="hover:text-white"
                  >
                    publik →
                  </Link>
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background-secondary p-4">
      <div className="flex items-center gap-2 mb-1 text-foreground-muted">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-semibold text-white tabular-nums">
        {value.toLocaleString("sv-SE")}
      </p>
    </div>
  );
}
