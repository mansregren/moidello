import { createClient } from "@/lib/supabase/server";
import type {
  Outfit,
  TaggedItem,
  User as MoidelloUser,
  Comment as MoidelloComment,
} from "@/lib/types";

/**
 * Wide client type that fits both the cookie-based server client and
 * the anon supabase-js client. We don't need any of the divergent
 * methods — only `.from(...)` chains — so a permissive shape is fine.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryClient = any;

/**
 * Resolve a usable client. Build-time / static callers pass an
 * already-constructed public client (createPublicClient) to avoid
 * reaching for cookies. Request-bound callers pass nothing and we
 * fall through to the cookie-aware server client.
 */
async function resolveClient(client?: QueryClient): Promise<QueryClient> {
  if (client) return client;
  return await createClient();
}

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
  slug: string | null;
  user_id: string;
  image_url: string;
  type: "photo" | "flatlay";
  gender: "herr" | "dam";
  code: string | null;
  title: string;
  description: string | null;
  meta_description: string | null;
  category: string | null;
  created_at: string;
  is_hidden?: boolean;
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
  description: string | null;
  keywords: string[] | null;
  alt_text: string | null;
  material: string | null;
  color: string | null;
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
    description: t.description,
    keywords: Array.isArray(t.keywords) ? t.keywords : undefined,
    altText: t.alt_text,
    material: t.material,
    color: t.color,
  }));

  return {
    id: row.id,
    slug: row.slug ?? undefined,
    image: row.image_url,
    type: row.type,
    gender: row.gender,
    title: row.title,
    code: row.code ?? undefined,
    description: row.description ?? "",
    metaDescription: row.meta_description ?? undefined,
    creator,
    tags,
    likes: row.outfit_stats?.likes ?? 0,
    saves: row.outfit_stats?.saves ?? 0,
    comments: [],
    category: row.category ?? "",
    createdAt: row.created_at,
    isHidden: !!row.is_hidden,
  };
}

// Disambiguate the embed: outfits has FKs to profiles via user_id AND
// transitively via likes / saves, so PostgREST refuses to embed without
// the !fkey hint. Comments on the outfit detail page get a similar
// hint when fetched separately.
const OUTFIT_COLUMNS = `
  id, slug, user_id, image_url, type, gender, code, title, description, meta_description, category, created_at, is_hidden,
  profiles!outfits_user_id_fkey ( id, username, display_name, avatar_url, bio, region ),
  tagged_items ( id, brand, name, price, currency, buy_url, buy_urls, garment, position_x, position_y, is_affiliate, description, keywords, alt_text, material, color )
`;

/**
 * Hydrate Outfit objects with their outfit_stats counts. The view doesn't
 * expose a foreign-key relationship to outfits in PostgREST's metadata so
 * embedded selects can fail; fetching it as a separate query is reliable.
 */
async function attachOutfitStats(
  outfits: Outfit[],
  client?: QueryClient,
): Promise<Outfit[]> {
  if (outfits.length === 0) return outfits;
  const supabase = await resolveClient(client);
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
export async function fetchOutfits(
  limit = 60,
  client?: QueryClient,
): Promise<Outfit[]> {
  const supabase = await resolveClient(client);
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
  return attachOutfitStats(mapped, supabase);
}

/**
 * Lightweight cover lookup for the homepage category cards: every
 * published outfit's category + gender + image, newest first. The
 * homepage only pulls 12 recent outfits for its grids, which isn't
 * enough to guarantee one image per category — this fills that gap
 * cheaply (3 columns, no joins, no stats).
 */
export async function fetchCategoryCovers(
  client?: QueryClient,
): Promise<Array<{ category: string; gender: "herr" | "dam"; image: string }>> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("outfits")
    .select("category, gender, image_url")
    .eq("is_published", true)
    .not("category", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) return [];
  return (
    data as Array<{ category: string; gender: string; image_url: string }>
  ).map((r) => ({
    category: r.category,
    gender: r.gender === "herr" ? "herr" : "dam",
    image: r.image_url,
  }));
}

export async function fetchOutfitsByUser(
  userId: string,
  client?: QueryClient,
): Promise<Outfit[]> {
  const supabase = await resolveClient(client);
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
  return attachOutfitStats(mapped, supabase);
}

/**
 * Returns recent published outfits from people the given user follows.
 * Two round-trips: one to read `follows` (cheap with the followee_id index),
 * one to read the outfits. Empty array when the user follows no-one — caller
 * is expected to fall back to a "suggested creators" UI in that case.
 */
export async function fetchFollowingFeed(
  viewerId: string,
  limit = 30,
): Promise<Outfit[]> {
  const supabase = await createClient();

  const { data: follows, error: followsError } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", viewerId);

  if (followsError) return [];
  const ids = ((follows ?? []) as Array<{ followee_id: string }>).map(
    (r) => r.followee_id,
  );
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .in("user_id", ids)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  const mapped = ((data ?? []) as unknown as OutfitRow[]).map(rowToOutfit);
  return attachOutfitStats(mapped, supabase);
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

/**
 * Resolve an outfit by its canonical /<username>/<slug> path. Looks up
 * the profile first (lowercased username) so we don't have to
 * denormalize username onto outfits.
 */
export async function fetchOutfitBySlug(
  username: string,
  slug: string,
  client?: QueryClient,
): Promise<Outfit | null> {
  const supabase = await resolveClient(client);

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!profileRow) return null;

  const { data, error } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .eq("user_id", profileRow.id)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  const mapped = rowToOutfit(data as unknown as OutfitRow);
  const [withStats] = await attachOutfitStats([mapped], supabase);
  return withStats;
}

export async function fetchOutfitById(
  id: string,
  client?: QueryClient,
): Promise<Outfit | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  const mapped = rowToOutfit(data as unknown as OutfitRow);
  const [withStats] = await attachOutfitStats([mapped], supabase);
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
  client?: QueryClient,
): Promise<MoidelloUser | null> {
  const supabase = await resolveClient(client);
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

export async function fetchTopCreators(
  limit = 12,
  client?: QueryClient,
): Promise<MoidelloUser[]> {
  const supabase = await resolveClient(client);
  // Use the profile_stats view to sort by followers; falls back to recent
  // profiles if the view doesn't exist yet.
  const { data: stats, error: statsError } = await supabase
    .from("profile_stats")
    .select("profile_id, outfits, followers, following")
    .order("followers", { ascending: false })
    .limit(limit);

  if (statsError) return [];
  if (!stats || stats.length === 0) return [];

  const typedStats = stats as ProfileStatsRow[];
  const ids = typedStats.map((s) => s.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, bio, region, instagram, tiktok, youtube, website, contact_email",
    )
    .in("id", ids);

  const profileMap = new Map(
    ((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p]),
  );

  return typedStats
    .map((s) => {
      const p = profileMap.get(s.profile_id);
      if (!p) return null;
      return profileToUser(p, s);
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

export async function fetchBrandsAggregated(
  client?: QueryClient,
  gender?: "dam" | "herr",
): Promise<BrandAggregate[]> {
  const supabase = await resolveClient(client);

  let outfitGenderFilter: Set<string> | null = null;
  if (gender) {
    const { data: genderRows } = await supabase
      .from("outfits")
      .select("id")
      .eq("gender", gender)
      .eq("is_published", true);
    outfitGenderFilter = new Set(
      ((genderRows ?? []) as Array<{ id: string }>).map((r) => r.id),
    );
  }

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
    const outfitId = row.outfit_id as string;
    if (outfitGenderFilter && !outfitGenderFilter.has(outfitId)) continue;
    const key = display.toLowerCase();
    const entry = counts.get(key) ?? { display, outfits: new Set<string>() };
    entry.outfits.add(outfitId);
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

export interface TaggedItemDetail {
  id: string;
  brand: string;
  name: string;
  price: number;
  currency: string;
  buyUrl: string;
  buyUrls?: Record<string, string>;
  garment: string;
  isAffiliate: boolean;
  /** AI-generated long-form description (migration 0036). */
  description: string | null;
  /** AI-generated SEO keywords; drives long-tail rank + future filters. */
  keywords: string[];
  /** AI-generated alt text used on the product image. */
  altText: string | null;
  /** Self-reported or AI-inferred material (linne, ull, denim, …). */
  material: string | null;
  /** color stored on tagged_items since 0031. Surfaced here so the
   *  product page and JSON-LD can use it without a second fetch. */
  color: string | null;
  outfitId: string;
  outfitSlug: string | null;
  outfitImage: string;
  outfitTitle: string;
  /** Tag's pinned x/y on the outfit image, in percent (0-100) */
  positionX: number;
  positionY: number;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface TaggedItemDetailRow {
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
  description: string | null;
  keywords: string[] | null;
  alt_text: string | null;
  material: string | null;
  color: string | null;
  outfit_id: string;
  outfits: {
    id: string;
    slug: string | null;
    image_url: string;
    title: string;
    profiles: {
      id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

export async function fetchTaggedItemById(
  id: string,
  client?: QueryClient,
): Promise<TaggedItemDetail | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("tagged_items")
    .select(
      `id, brand, name, price, currency, buy_url, buy_urls, garment,
       position_x, position_y, is_affiliate,
       description, keywords, alt_text, material, color,
       outfit_id,
       outfits(
         id, slug, image_url, title,
         profiles!outfits_user_id_fkey(id, username, display_name, avatar_url)
       )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  const r = data as unknown as TaggedItemDetailRow;
  if (!r.outfits) return null;

  const profile = r.outfits.profiles;
  return {
    id: r.id,
    brand: r.brand,
    name: r.name,
    price: r.price ?? 0,
    currency: r.currency ?? "SEK",
    buyUrl: r.buy_url ?? "",
    buyUrls: r.buy_urls ?? undefined,
    garment: r.garment,
    isAffiliate: r.is_affiliate,
    description: r.description,
    keywords: Array.isArray(r.keywords) ? r.keywords : [],
    altText: r.alt_text,
    material: r.material,
    color: r.color,
    outfitId: r.outfit_id,
    outfitSlug: r.outfits.slug,
    outfitImage: r.outfits.image_url,
    outfitTitle: r.outfits.title,
    positionX: Number(r.position_x),
    positionY: Number(r.position_y),
    creator: {
      id: profile?.id ?? "",
      username: profile?.username ?? "",
      displayName: profile?.display_name ?? profile?.username ?? "",
      avatarUrl: profile?.avatar_url ?? null,
    },
  };
}

/**
 * Outfits that tag the same brand+name combination — i.e. "andra outfits
 * som stylar detta plagg". Excludes the source outfit unless explicitly
 * passed.
 */
export async function fetchOutfitsByItem(
  brand: string,
  name: string,
  excludeOutfitId?: string,
): Promise<Outfit[]> {
  const supabase = await createClient();
  const { data: tagRows } = await supabase
    .from("tagged_items")
    .select("outfit_id, brand, name");
  if (!tagRows) return [];

  const targetBrand = brand.toLowerCase();
  const targetName = name.toLowerCase();
  const ids = Array.from(
    new Set(
      tagRows
        .filter(
          (r) =>
            (r.brand as string).toLowerCase() === targetBrand &&
            (r.name as string).toLowerCase() === targetName,
        )
        .map((r) => r.outfit_id as string)
        .filter((id) => id !== excludeOutfitId),
    ),
  );
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .in("id", ids)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const mapped = ((data ?? []) as unknown as OutfitRow[]).map(rowToOutfit);
  return attachOutfitStats(mapped);
}

/**
 * Outfits where any tagged_item has the given color. Color match is
 * case-insensitive. Used by /farg/[slug] landing pages.
 */
export async function fetchOutfitsByColor(
  color: string,
  gender?: "dam" | "herr",
  client?: QueryClient,
): Promise<Outfit[]> {
  const supabase = await resolveClient(client);
  const targetKey = color.toLowerCase().trim();
  if (!targetKey) return [];

  const { data: tagRows } = await supabase
    .from("tagged_items")
    .select("outfit_id, color")
    .not("color", "is", null);
  if (!tagRows) return [];

  const outfitIds = Array.from(
    new Set(
      (tagRows as Array<{ outfit_id: string; color: string | null }>)
        .filter((r) => (r.color ?? "").toLowerCase() === targetKey)
        .map((r) => r.outfit_id),
    ),
  );
  if (outfitIds.length === 0) return [];

  let query = supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .in("id", outfitIds)
    .eq("is_published", true);
  if (gender) query = query.eq("gender", gender);
  const { data } = await query
    .order("created_at", { ascending: false })
    .limit(100);

  const mapped = ((data ?? []) as unknown as OutfitRow[]).map(rowToOutfit);
  return attachOutfitStats(mapped, supabase);
}

/**
 * Distinct color slugs across all active tagged_items. Used by /farg/
 * route generation + sitemap.
 */
export async function fetchAllColors(
  client?: QueryClient,
): Promise<Array<{ color: string; count: number }>> {
  const supabase = await resolveClient(client);
  const { data } = await supabase
    .from("tagged_items")
    .select("color")
    .eq("is_active", true)
    .not("color", "is", null);
  if (!data) return [];
  const counts = new Map<string, number>();
  for (const r of data as Array<{ color: string }>) {
    const c = r.color?.toLowerCase().trim();
    if (!c) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Outfits where any tagged_item has the given garment-type, for the
 * given gender. Drives /typ/[gender]/[garment] landing pages.
 */
export async function fetchOutfitsByGarment(
  gender: "dam" | "herr",
  garment: string,
  client?: QueryClient,
): Promise<Outfit[]> {
  const supabase = await resolveClient(client);
  const garmentKey = garment.toLowerCase().trim();
  if (!garmentKey) return [];

  const { data: tagRows } = await supabase
    .from("tagged_items")
    .select("outfit_id, garment");
  if (!tagRows) return [];

  const outfitIds = Array.from(
    new Set(
      (tagRows as Array<{ outfit_id: string; garment: string }>)
        .filter((r) => (r.garment ?? "").toLowerCase() === garmentKey)
        .map((r) => r.outfit_id),
    ),
  );
  if (outfitIds.length === 0) return [];

  const { data } = await supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .in("id", outfitIds)
    .eq("is_published", true)
    .eq("gender", gender)
    .order("created_at", { ascending: false })
    .limit(100);

  const mapped = ((data ?? []) as unknown as OutfitRow[]).map(rowToOutfit);
  return attachOutfitStats(mapped, supabase);
}

/**
 * Outfits matching a given category (minimalism, vintage, casual, …),
 * gender-filtered. Drives /stil/[slug] landing pages.
 */
export async function fetchOutfitsByCategory(
  category: string,
  gender?: "dam" | "herr",
  client?: QueryClient,
): Promise<Outfit[]> {
  const supabase = await resolveClient(client);
  let query = supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .ilike("category", category)
    .eq("is_published", true);
  if (gender) query = query.eq("gender", gender);
  const { data } = await query
    .order("created_at", { ascending: false })
    .limit(100);

  const mapped = ((data ?? []) as unknown as OutfitRow[]).map(rowToOutfit);
  return attachOutfitStats(mapped, supabase);
}

export async function fetchBrandOutfits(
  brandName: string,
  gender?: "dam" | "herr",
): Promise<Outfit[]> {
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

  let query = supabase
    .from("outfits")
    .select(OUTFIT_COLUMNS)
    .in("id", outfitIds)
    .eq("is_published", true);
  if (gender) query = query.eq("gender", gender);
  const { data } = await query.order("created_at", { ascending: false });

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
