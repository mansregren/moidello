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
  ExternalLink,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { UserAvatar } from "@/components/user/UserAvatar";
import { createClient } from "@/lib/supabase/server";
import { outfitPathFromParts } from "@/lib/outfit-url";
import {
  OutfitEditor,
  TagsEditor,
  type OutfitForm,
  type TagForm,
} from "./OutfitEditor";

export const dynamic = "force-dynamic";

export default async function AdminOutfitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: outfit } = await supabase
    .from("outfits")
    .select(
      "id, slug, user_id, title, description, category, gender, is_published, image_url, image_path, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!outfit) notFound();

  const { data: creator } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, is_demo")
    .eq("id", outfit.user_id)
    .maybeSingle();

  const { data: tags } = await supabase
    .from("tagged_items")
    .select(
      "id, brand, name, buy_url, price, currency, garment, is_affiliate",
    )
    .eq("outfit_id", id)
    .order("garment", { ascending: true });

  const { data: stats } = await supabase
    .from("outfit_engagement")
    .select("views, unique_views, likes, saves, comments, clicks")
    .eq("outfit_id", id)
    .maybeSingle();

  // Per-tag click count, sorted desc.
  const { data: tagClicks } = await supabase
    .from("tag_clicks")
    .select("tag_id")
    .eq("outfit_id", id);

  const tagClickCount = new Map<string, number>();
  for (const r of (tagClicks ?? []) as Array<{ tag_id: string }>) {
    tagClickCount.set(r.tag_id, (tagClickCount.get(r.tag_id) ?? 0) + 1);
  }

  const outfitForm: OutfitForm = {
    id: outfit.id as string,
    title: outfit.title as string,
    description: (outfit.description as string | null) ?? "",
    category: (outfit.category as string | null) ?? "",
    gender: ((outfit.gender as string | null) ?? "dam") as "dam" | "herr",
    is_published: !!outfit.is_published,
  };

  const tagsForm: TagForm[] = ((tags ?? []) as Array<TagForm>).map((t) => ({
    ...t,
    click_count: tagClickCount.get(t.id) ?? 0,
  }));

  const created = new Date(outfit.created_at as string).toLocaleString(
    "sv-SE",
    { dateStyle: "medium", timeStyle: "short" },
  );

  const publicUrl = outfit.slug
    ? outfitPathFromParts(
        (creator?.username as string) ?? "",
        outfit.slug as string,
        outfit.id as string,
      )
    : `/outfit/${outfit.id}`;

  return (
    <Container className="max-w-6xl">
      <Link
        href="/admin/inlagg"
        className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Alla inlägg
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-background-tertiary">
            <Image
              src={outfit.image_url as string}
              alt={outfit.title as string}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
              unoptimized={(outfit.image_url as string).startsWith("http")}
            />
            {!outfit.is_published && (
              <span className="absolute top-3 left-3 inline-flex rounded-full bg-amber-500/90 text-black px-3 py-1 text-xs uppercase tracking-wider font-semibold">
                Utkast
              </span>
            )}
          </div>

          {creator && (
            <Link
              href={`/admin/anvandare/${creator.id}`}
              className="mt-4 flex items-center gap-3 p-3 rounded-2xl border border-border bg-background-secondary hover:border-white/30 transition-colors"
            >
              <UserAvatar
                src={(creator.avatar_url as string | null) ?? ""}
                alt={(creator.display_name as string | null) ?? creator.username}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {(creator.display_name as string | null) ?? creator.username}
                  {creator.is_demo && (
                    <span className="ml-2 inline-flex rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                      Demo
                    </span>
                  )}
                </p>
                <p className="text-xs text-foreground-subtle">
                  @{creator.username}
                </p>
              </div>
              <Link
                href={`/profile/${creator.username}`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 text-foreground-muted hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Link>
          )}

          <div className="mt-4 flex gap-3 text-xs text-foreground-subtle">
            <span>Skapad {created}</span>
            <span>·</span>
            <Link
              href={publicUrl}
              target="_blank"
              className="hover:text-white inline-flex items-center gap-1"
            >
              Publik vy
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <section className="mt-8 grid grid-cols-3 sm:grid-cols-6 gap-2">
            <Stat icon={Eye} label="Visn." value={stats?.views ?? 0} />
            <Stat icon={Eye} label="Unika" value={stats?.unique_views ?? 0} />
            <Stat icon={Heart} label="Likes" value={stats?.likes ?? 0} />
            <Stat icon={Bookmark} label="Saves" value={stats?.saves ?? 0} />
            <Stat
              icon={MessageCircle}
              label="Komm."
              value={stats?.comments ?? 0}
            />
            <Stat
              icon={MousePointerClick}
              label="Klick"
              value={stats?.clicks ?? 0}
            />
          </section>
        </div>

        <div className="space-y-8">
          <OutfitEditor outfit={outfitForm} />
          <TagsEditor outfitId={outfit.id as string} tags={tagsForm} />
        </div>
      </div>
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
    <div className="rounded-xl border border-border bg-background-secondary p-3 text-center">
      <Icon className="h-4 w-4 text-foreground-muted mx-auto mb-1" />
      <p className="text-base sm:text-lg font-semibold text-white tabular-nums">
        {value.toLocaleString("sv-SE")}
      </p>
      <p className="text-[10px] text-foreground-subtle uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}
