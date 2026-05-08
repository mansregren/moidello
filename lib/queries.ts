import { createClient } from "@/lib/supabase/server";
import type {
  Outfit,
  TaggedItem,
  User as MoidelloUser,
  Comment as MoidelloComment,
} from "@/lib/types";

interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  region: string;
}

interface ProfileStatsRow {
  profile_id: string;
  outfits: number;
  followers: number;
  following: number;
}

interface OutfitStatsRow {
  outfit_id: string;
  likes: number;
  saves: number;
  comments: number;
}

interface OutfitRow {
  id: string;
  user_id: string;
  image_url: string;
  type: "photo" | "flatlay";
  gender: "herr" | "dam";
  title: string;
  description: string | null;
  category: string | null;
  created_at: string;
  profiles: ProfileRow | null;
  tagged_items: TaggedItemRow[];
  outfit_stats?: OutfitStatsRow | null;
}

interface TaggedItemRow {
  id: string;
  brand: string;
  name: string;
  price: number | null;
  currency: string | null;
  buy_url: string | null;
  garment: string;
  position_x: number;
  position_y: number;
  is_affiliate: boolean;
}

interface CommentRow {
  id: string;
  body: string;
  created_at: string;
  profiles: ProfileRow | null;
}

function profileToUser(p: ProfileRow, stats?: ProfileStatsRow | null): MoidelloUser {
  return {
    id: p.id,
    username: p.username,
    displayName: p.display_name ?? p.username,
    avatar: p.avatar_url ?? "",
    bio: p.bio ?? "",
    followers: stats?.followers ?? 0,
    following: stats?.following ?? 0,
    outfitCount: stats?.outfits ?? 0,
    region: p.region,
  };
}

function rowToOutfit(row: OutfitRow): Outfit {
  const creator: MoidelloUser = row.profiles
    ? profileToUser(row.profiles)
    : {
        id: row.user_id,
        username: "okänd",
        displayName: "Okänd",
        avatar: "",
        bio: "",
        followers: 0,
        following: 0,
        outfitCount: 0,
      };

  const tags: TaggedItem[] = row.tagged_items.map((t) => ({
    id: t.id,
    brand: t.brand,
    name: t.name,
    price: t.price ?? 0,
    currency: t.currency ?? "SEK",
    buyUrl: t.buy_url ?? "",
    garment: t.garment as TaggedItem["garment"],
    x: Number(t.position_x),
    y: Number(t.position_y),
    isAffiliate: t.is_affiliate,
  }));

  return {
    id: row.id,
    image: row.image_url,
    type: row.type,
    gender: row.gender,
    title: row.title,
    description: row.description ?? "",
    creator,
    tags,
    likes: row.outfit_stats?.likes ?? 0,
    saves: row.outfit_stats?.saves ?? 0,
    comments: [],
    category: row.category ?? "",
    createdAt: row.created_at,
  };
}

const OUTFIT_COLUMNS = `
  id, user_id, image_url, type, gender, title, description, category, created_at,
  profiles ( id, username, display_name, avatar_url, bio, region ),
  tagged_items ( id, brand, name, price, currency, buy_url, garment, position_x, position_y, is_affiliate ),
  outfit_stats ( outfit_id, likes, saves, comments )
`;

/**
 * Returns published outfits ordered by recency. Empty array if the table
 * doesn't exist yet (migration not run) — caller can fall back to mocks.
 */
export async function fetchOutfits(limit = 60): Promise<Outfit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === "42P01") return [];
    console.error("fetchOutfits failed:", error);
    return [];
  }

  return ((data ?? []) as unknown as OutfitRow[]).map(rowToOutfit);
}

export async function fetchOutfitsByUser(userId: string): Promise<Outfit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") return [];
    return [];
  }
  return ((data ?? []) as unknown as OutfitRow[]).map(rowToOutfit);
}

export async function fetchSavedOutfitsByUser(userId: string): Promise<Outfit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saves")
    .select(`outfit:outfits ( ${OUTFIT_COLUMNS} )`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return ((data ?? []) as unknown as { outfit: OutfitRow | null }[])
    .map((r) => r.outfit)
    .filter((o): o is OutfitRow => !!o)
    .map(rowToOutfit);
}

export async function fetchOutfitById(id: string): Promise<Outfit | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return rowToOutfit(data as unknown as OutfitRow);
}

export async function fetchOutfitComments(
  outfitId: string,
): Promise<MoidelloComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(
      "id, body, created_at, profiles ( id, username, display_name, avatar_url, bio, region )",
    )
    .eq("outfit_id", outfitId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as unknown as CommentRow[])
    .filter((c) => c.profiles)
    .map((c) => ({
      id: c.id,
      user: profileToUser(c.profiles!),
      text: c.body,
      createdAt: c.created_at,
      likes: 0,
    }));
}

export async function fetchProfileByUsername(
  username: string,
): Promise<MoidelloUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, region")
    .eq("username", username)
    .maybeSingle();

  if (error || !data) return null;

  const { data: stats } = await supabase
    .from("profile_stats")
    .select("profile_id, outfits, followers, following")
    .eq("profile_id", data.id)
    .maybeSingle();

  return profileToUser(data as ProfileRow, stats as ProfileStatsRow | null);
}

export async function fetchCurrentProfile(): Promise<MoidelloUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, region")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  const { data: stats } = await supabase
    .from("profile_stats")
    .select("profile_id, outfits, followers, following")
    .eq("profile_id", user.id)
    .maybeSingle();

  return profileToUser(data as ProfileRow, stats as ProfileStatsRow | null);
}

/**
 * For a logged-in viewer, returns the set of outfit IDs they've liked /
 * saved among the given outfits — used to render heart/bookmark filled state
 * in feeds without N round-trips.
 */
export async function fetchEngagementForViewer(
  outfitIds: string[],
): Promise<{ liked: Set<string>; saved: Set<string> }> {
  const empty = { liked: new Set<string>(), saved: new Set<string>() };
  if (outfitIds.length === 0) return empty;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const [likesRes, savesRes] = await Promise.all([
    supabase
      .from("likes")
      .select("outfit_id")
      .eq("user_id", user.id)
      .in("outfit_id", outfitIds),
    supabase
      .from("saves")
      .select("outfit_id")
      .eq("user_id", user.id)
      .in("outfit_id", outfitIds),
  ]);

  return {
    liked: new Set((likesRes.data ?? []).map((r) => r.outfit_id as string)),
    saved: new Set((savesRes.data ?? []).map((r) => r.outfit_id as string)),
  };
}

export async function isFollowing(followeeId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === followeeId) return false;

  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("followee_id", followeeId)
    .maybeSingle();

  return !!data;
}
