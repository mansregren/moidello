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
  account_type?: "creator" | "brand" | null;
  brand_name?: string | null;
  brand_website?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  website?: string | null;
  contact_email?: string | null;
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
  buy_urls: Record<string, string> | null;
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
    accountType: p.account_type ?? undefined,
    brandName: p.brand_name ?? undefined,
    brandWebsite: p.brand_website ?? undefined,
    instagram: p.instagram ?? undefined,
    tiktok: p.tiktok ?? undefined,
    youtube: p.youtube ?? undefined,
    website: p.website ?? undefined,
    contactEmail: p.contact_email ?? undefined,
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
    buyUrls: t.buy_urls ?? undefined,
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

// Disambiguate the embed: outfits has FKs to profiles via user_id AND
// transitively via likes / saves, so PostgREST refuses to embed without
// the !fkey hint. Comments on the outfit detail page get a similar
// hint when fetched separately.
const OUTFIT_COLUMNS = `
  id, user_id, image_url, type, gender, title, description, category, created_at,
  profiles!outfits_user_id_fkey ( id, username, display_name, avatar_url, bio, region ),
  tagged_items ( id, brand, name, price, currency, buy_url, buy_urls, garment, position_x, position_y, is_affiliate )
`;

/**
 * Hydrate Outfit objects with their outfit_stats counts. The view doesn't
 * expose a foreign-key relationship to outfits in PostgREST's metadata so
 * embedded selects can fail; fetching it as a separate query is reliable.
 */
async function attachOutfitStats(outfits: Outfit[]): Promise<Outfit[]> {
  if (outfits.length === 0) return outfits;
  const supabase = await createClient();
  const { data } = await supabase
    .from("outfit_stats")
    .select("outfit_id, likes, saves, comments")
    .in("outfit_id", outfits.map((o) => o.id));
  if (!data) return outfits;
  const byId = new Map<string, { likes: number; saves: number }>();
  for (const r of data as Array<{ outfit_id: string; likes: number; saves: number }>) {
    byId.set(r.outfit_id, { likes: r.likes, saves: r.saves });
  }
  return outfits.map((o) => {
    const s = byId.get(o.id);
    if (!s) return o;
    return { ...o, likes: s.likes, saves: s.saves };
  });
}

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

  const mapped = ((data ?? []) as unknown as OutfitRow[]).map(rowToOutfit);
  return attachOutfitStats(mapped);
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
  const mapped = ((data ?? []) as unknown as OutfitRow[]).map(rowToOutfit);
  return attachOutfitStats(mapped);
}

export async function fetchSavedOutfitsByUser(userId: string): Promise<Outfit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saves")
    .select(`outfit:outfits ( ${OUTFIT_COLUMNS} )`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  const mapped = ((data ?? []) as unknown as { outfit: OutfitRow | null }[])
    .map((r) => r.outfit)
    .filter((o): o is OutfitRow => !!o)
    .map(rowToOutfit);
  return attachOutfitStats(mapped);
}

export async function fetchOutfitById(id: string): Promise<Outfit | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  const mapped = rowToOutfit(data as unknown as OutfitRow);
  const [withStats] = await attachOutfitStats([mapped]);
  return withStats;
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
    .select(
      "id, username, display_name, avatar_url, bio, region, instagram, tiktok, youtube, website, contact_email",
    )
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
    .select(
      "id, username, display_name, avatar_url, bio, region, instagram, tiktok, youtube, website, contact_email",
    )
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

export async function fetchTopCreators(limit = 12): Promise<MoidelloUser[]> {
  const supabase = await createClient();
  // Use the profile_stats view to sort by followers; falls back to recent
  // profiles if the view doesn't exist yet.
  const { data: stats, error: statsError } = await supabase
    .from("profile_stats")
    .select("profile_id, outfits, followers, following")
    .order("followers", { ascending: false })
    .limit(limit);

  if (statsError) return [];
  if (!stats || stats.length === 0) return [];

  const ids = stats.map((s) => s.profile_id as string);
  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, bio, region, instagram, tiktok, youtube, website, contact_email",
    )
    .in("id", ids);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id as string, p as ProfileRow]),
  );

  return stats
    .map((s) => {
      const p = profileMap.get(s.profile_id as string);
      if (!p) return null;
      return profileToUser(p, s as ProfileStatsRow);
    })
    .filter((u): u is MoidelloUser => !!u);
}

export async function fetchTopOutfits(limit = 12): Promise<Outfit[]> {
  const supabase = await createClient();
  const { data: statsRows, error } = await supabase
    .from("outfit_stats")
    .select("outfit_id, likes, saves, comments")
    .order("likes", { ascending: false })
    .limit(limit);

  if (error || !statsRows || statsRows.length === 0) return [];

  const ids = statsRows.map((r) => r.outfit_id as string);
  const { data: outfitRows } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .in("id", ids)
    .eq("is_published", true);

  if (!outfitRows) return [];
  const byId = new Map(
    (outfitRows as unknown as OutfitRow[]).map((o) => [o.id, o]),
  );
  // Preserve sort order from outfit_stats
  const ordered = statsRows
    .map((r) => byId.get(r.outfit_id as string))
    .filter((o): o is OutfitRow => !!o)
    .map(rowToOutfit);
  return attachOutfitStats(ordered);
}

export interface BrandAggregate {
  name: string;
  slug: string;
  outfitCount: number;
  isClaimed: boolean;
  claimedBy?: { username: string; avatar: string; website: string | null };
}

function brandSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface ClaimedBrandRow {
  id: string;
  username: string;
  avatar_url: string | null;
  brand_name: string;
  brand_website: string | null;
}

export async function fetchBrandsAggregated(): Promise<BrandAggregate[]> {
  const supabase = await createClient();

  const [{ data: items }, { data: claimed }] = await Promise.all([
    supabase.from("tagged_items").select("brand, outfit_id"),
    supabase
      .from("profiles")
      .select("id, username, avatar_url, brand_name, brand_website")
      .eq("account_type", "brand")
      .not("brand_name", "is", null),
  ]);

  const claimedRows = (claimed ?? []) as unknown as ClaimedBrandRow[];

  const counts = new Map<string, { display: string; outfits: Set<string> }>();
  for (const row of items ?? []) {
    const display = (row.brand as string).trim();
    if (!display) continue;
    const key = display.toLowerCase();
    const entry = counts.get(key) ?? { display, outfits: new Set<string>() };
    entry.outfits.add(row.outfit_id as string);
    counts.set(key, entry);
  }

  const claimedByKey = new Map<string, ClaimedBrandRow>();
  for (const c of claimedRows) {
    if (c.brand_name) claimedByKey.set(c.brand_name.toLowerCase(), c);
  }
  // Brands with claimed profiles but zero tagged outfits should still appear.
  for (const c of claimedRows) {
    if (!c.brand_name) continue;
    const key = c.brand_name.toLowerCase();
    if (!counts.has(key)) {
      counts.set(key, { display: c.brand_name, outfits: new Set() });
    }
  }

  const result: BrandAggregate[] = [];
  for (const [key, value] of counts) {
    const claim = claimedByKey.get(key);
    result.push({
      name: claim?.brand_name ?? value.display,
      slug: brandSlug(claim?.brand_name ?? value.display),
      outfitCount: value.outfits.size,
      isClaimed: !!claim,
      claimedBy: claim
        ? {
            username: claim.username,
            avatar: claim.avatar_url ?? "",
            website: claim.brand_website,
          }
        : undefined,
    });
  }
  return result.sort((a, b) => b.outfitCount - a.outfitCount);
}

export async function fetchBrandOutfits(brandName: string): Promise<Outfit[]> {
  const supabase = await createClient();

  // tagged_items has a lower(brand) index from migration 0007
  const { data: tagRows } = await supabase
    .from("tagged_items")
    .select("outfit_id, brand");

  if (!tagRows) return [];
  const targetKey = brandName.toLowerCase();
  const outfitIds = Array.from(
    new Set(
      tagRows
        .filter((r) => (r.brand as string).toLowerCase() === targetKey)
        .map((r) => r.outfit_id as string),
    ),
  );
  if (outfitIds.length === 0) return [];

  const { data } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .in("id", outfitIds)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const mapped = ((data ?? []) as unknown as OutfitRow[]).map(rowToOutfit);
  return attachOutfitStats(mapped);
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
