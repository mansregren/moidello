import { createClient } from "@/lib/supabase/server";
import type { Outfit, TaggedItem, User as MoidelloUser } from "@/lib/types";

interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  region: string;
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

function profileToUser(p: ProfileRow): MoidelloUser {
  return {
    id: p.id,
    username: p.username,
    displayName: p.display_name ?? p.username,
    avatar: p.avatar_url ?? "",
    bio: p.bio ?? "",
    followers: 0,
    following: 0,
    outfitCount: 0,
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
    likes: 0,
    saves: 0,
    comments: [],
    category: row.category ?? "",
    createdAt: row.created_at,
  };
}

const OUTFIT_COLUMNS = `
  id, user_id, image_url, type, gender, title, description, category, created_at,
  profiles ( id, username, display_name, avatar_url, bio, region ),
  tagged_items ( id, brand, name, price, currency, buy_url, garment, position_x, position_y, is_affiliate )
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
    if (error.code === "42P01") return []; // table missing
    console.error("fetchOutfits failed:", error);
    return [];
  }

  return ((data ?? []) as unknown as OutfitRow[]).map(rowToOutfit);
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
  return profileToUser(data as ProfileRow);
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
  return profileToUser(data as ProfileRow);
}
