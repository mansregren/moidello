import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Globe } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { createClient } from "@/lib/supabase/server";
import { fetchEngagementForViewer } from "@/lib/queries";
import type { Outfit, User as MoidelloUser } from "@/lib/types";
import { BoardOwnerActions } from "./BoardOwnerActions";

export const dynamic = "force-dynamic";

interface BoardRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface BoardOutfitJoin {
  outfit: {
    id: string;
    user_id: string;
    image_url: string;
    type: "photo" | "flatlay";
    gender: "herr" | "dam";
    title: string;
    description: string | null;
    category: string | null;
    created_at: string;
    profiles: {
      id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
    outfit_stats: { likes: number; saves: number; comments: number } | null;
  } | null;
}

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: boardRow, error: boardError } = await supabase
    .from("boards")
    .select(
      "id, user_id, name, description, is_public, created_at, profiles(id, username, display_name, avatar_url)",
    )
    .eq("id", id)
    .maybeSingle();

  if (boardError?.code === "42P01") {
    notFound();
  }
  if (!boardRow) notFound();
  const board = boardRow as unknown as BoardRow;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === board.user_id;

  if (!board.is_public && !isOwner) {
    notFound();
  }

  const { data: outfitJoinData } = await supabase
    .from("board_outfits")
    .select(
      `outfit:outfits(
        id, user_id, image_url, type, gender, title, description, category, created_at,
        profiles(id, username, display_name, avatar_url),
        outfit_stats(likes, saves, comments)
      )`,
    )
    .eq("board_id", board.id)
    .order("added_at", { ascending: false });

  const outfits: Outfit[] = ((outfitJoinData ?? []) as unknown as BoardOutfitJoin[])
    .map((row) => row.outfit)
    .filter((o): o is NonNullable<BoardOutfitJoin["outfit"]> => !!o)
    .map((o) => {
      const creator: MoidelloUser = o.profiles
        ? {
            id: o.profiles.id,
            username: o.profiles.username,
            displayName: o.profiles.display_name ?? o.profiles.username,
            avatar: o.profiles.avatar_url ?? "",
            bio: "",
            followers: 0,
            following: 0,
            outfitCount: 0,
          }
        : {
            id: o.user_id,
            username: "",
            displayName: "",
            avatar: "",
            bio: "",
            followers: 0,
            following: 0,
            outfitCount: 0,
          };
      return {
        id: o.id,
        image: o.image_url,
        type: o.type,
        gender: o.gender,
        title: o.title,
        description: o.description ?? "",
        creator,
        tags: [],
        likes: o.outfit_stats?.likes ?? 0,
        saves: o.outfit_stats?.saves ?? 0,
        comments: [],
        category: o.category ?? "",
        createdAt: o.created_at,
      };
    });

  const { liked, saved } = await fetchEngagementForViewer(
    outfits.map((o) => o.id),
  );

  const owner = board.profiles;

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-6 md:pt-10">
        <Container>
          <Link
            href={
              isOwner
                ? "/profil/boards"
                : owner
                  ? `/profile/${owner.username}`
                  : "/"
            }
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {isOwner ? "Mina samlingar" : owner ? `Profilen för @${owner.username}` : "Tillbaka"}
          </Link>

          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background-secondary px-3 py-1 text-[11px] uppercase tracking-wider text-foreground-muted">
              {board.is_public ? (
                <>
                  <Globe className="h-3 w-3" /> Publik samling
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" /> Privat samling
                </>
              )}
            </span>
          </div>

          <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
            {board.name}
          </h1>

          {owner && !isOwner && (
            <p className="mt-3 text-foreground-muted text-sm">
              Av{" "}
              <Link
                href={`/profile/${owner.username}`}
                className="text-white hover:underline"
              >
                {owner.display_name ?? owner.username}
              </Link>
            </p>
          )}

          {board.description && (
            <p className="mt-4 text-base text-foreground-muted max-w-2xl">
              {board.description}
            </p>
          )}

          <p className="mt-3 text-sm text-foreground-subtle">
            {outfits.length} {outfits.length === 1 ? "outfit" : "outfits"}
          </p>

          {isOwner && (
            <div className="mt-6">
              <BoardOwnerActions
                boardId={board.id}
                name={board.name}
                description={board.description}
                isPublic={board.is_public}
              />
            </div>
          )}

          <div className="mt-10">
            {outfits.length > 0 ? (
              <OutfitGrid outfits={outfits} columns={3} liked={liked} saved={saved} />
            ) : (
              <div className="rounded-2xl border border-border bg-background-secondary p-10 text-center">
                <p className="text-foreground-muted">
                  Den här samlingen är tom. Lägg till outfits från en outfit-sida.
                </p>
              </div>
            )}
          </div>

          <div className="py-16" />
        </Container>
      </main>
    </>
  );
}
