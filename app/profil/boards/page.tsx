import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";
import { BoardsClient, type BoardSummary } from "./BoardsClient";

export const dynamic = "force-dynamic";

interface BoardSummaryRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  cover_outfit_id: string | null;
  created_at: string;
  outfit_count: number;
}

export default async function BoardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("board_summary")
    .select(
      "id, user_id, name, description, is_public, cover_outfit_id, created_at, outfit_count",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (error?.code === "42P01" ? [] : (data ?? [])) as BoardSummaryRow[];

  // Resolve cover image URLs in a single query
  const coverIds = rows.map((r) => r.cover_outfit_id).filter((x): x is string => !!x);
  let coverMap = new Map<string, string>();
  if (coverIds.length > 0) {
    const { data: covers } = await supabase
      .from("outfits")
      .select("id, image_url")
      .in("id", coverIds);
    if (covers) {
      coverMap = new Map(covers.map((c) => [c.id as string, c.image_url as string]));
    }
  }

  // Fall back to a featured outfit per board if no cover set
  const boardIdsWithoutCover = rows
    .filter((r) => !r.cover_outfit_id)
    .map((r) => r.id);
  const fallbackByBoard = new Map<string, string>();
  if (boardIdsWithoutCover.length > 0) {
    const { data: fallback } = await supabase
      .from("board_outfits")
      .select("board_id, outfit:outfits(image_url)")
      .in("board_id", boardIdsWithoutCover)
      .order("added_at", { ascending: false });
    if (fallback) {
      for (const row of fallback as unknown as Array<{
        board_id: string;
        outfit: { image_url: string } | null;
      }>) {
        if (!fallbackByBoard.has(row.board_id) && row.outfit?.image_url) {
          fallbackByBoard.set(row.board_id, row.outfit.image_url);
        }
      }
    }
  }

  const boards: BoardSummary[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isPublic: r.is_public,
    outfitCount: r.outfit_count,
    coverImage: r.cover_outfit_id
      ? coverMap.get(r.cover_outfit_id) ?? null
      : fallbackByBoard.get(r.id) ?? null,
  }));

  const migrationMissing = error?.code === "42P01";

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-6 md:pt-10">
        <Container>
          <BoardsClient
            boards={boards}
            migrationMissing={migrationMissing}
          />
        </Container>
      </main>
    </>
  );
}
