"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { isHostnameSafe, previewProduct } from "@/lib/retailers/preview";
import { downloadImage, storeCatalogImage } from "@/lib/catalog/image";
import {
  catalogUrlKey,
  cleanBuyUrl,
  guessColor,
  guessGarment,
} from "@/lib/catalog/guess";
import {
  CATALOG_SELECT,
  toCatalogItem,
  type CatalogDraft,
  type CatalogItem,
  type CatalogRow,
} from "@/lib/catalog/types";
import type { Gender } from "@/lib/garments";
import { parseBuilderLayout } from "@/lib/catalog/layout";
import { slugify, storageFilename } from "@/lib/slug";
import type { Database } from "@/lib/supabase/database.types";

type CatalogInsert = Database["public"]["Tables"]["catalog_items"]["Insert"];
type CatalogUpdate = Database["public"]["Tables"]["catalog_items"]["Update"];
type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_URLS_PER_PREVIEW = 25;
const ACCEPTED_UPLOADS = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

async function adminClient() {
  if (!(await isCurrentUserAdmin())) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, userId: user.id } : null;
}

function parseGender(v: unknown): Gender | null {
  return v === "herr" || v === "dam" ? v : null;
}

function cleanPrice(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  return v !== null && v !== "" && Number.isFinite(n) && n >= 0
    ? Math.round(n * 100) / 100
    : null;
}

/** Shared validation for the editable fields of a catalog item. */
function cleanFields(input: {
  brand?: unknown;
  name?: unknown;
  garment?: unknown;
  gender?: unknown;
  color?: unknown;
  material?: unknown;
  price?: unknown;
  currency?: unknown;
  buyUrl?: unknown;
}): Result<{ fields: CatalogUpdate }> {
  const fields: CatalogUpdate = {};
  if (input.brand !== undefined) {
    const b = String(input.brand ?? "").trim();
    if (!b) return { ok: false, error: "Märke saknas." };
    fields.brand = b.slice(0, 120);
  }
  if (input.name !== undefined) {
    const n = String(input.name ?? "").trim();
    if (!n) return { ok: false, error: "Namn saknas." };
    fields.name = n.slice(0, 200);
  }
  if (input.garment !== undefined) {
    const g = String(input.garment ?? "").trim();
    if (!g) return { ok: false, error: "Typ saknas." };
    fields.garment = g.slice(0, 40);
  }
  if (input.gender !== undefined) fields.gender = parseGender(input.gender);
  if (input.color !== undefined) {
    fields.color = String(input.color ?? "").trim().slice(0, 40) || null;
  }
  if (input.material !== undefined) {
    fields.material = String(input.material ?? "").trim().slice(0, 60) || null;
  }
  if (input.price !== undefined) fields.price = cleanPrice(input.price);
  if (input.currency !== undefined) {
    fields.currency =
      String(input.currency ?? "").trim().toUpperCase().slice(0, 8) || "SEK";
  }
  if (input.buyUrl !== undefined) {
    const raw = String(input.buyUrl ?? "").trim();
    if (raw && !/^https?:\/\//i.test(raw)) {
      return { ok: false, error: "Köplänken måste börja med http(s)." };
    }
    fields.buy_url = raw ? cleanBuyUrl(raw).slice(0, 2000) : null;
    fields.url_key = catalogUrlKey(raw);
  }
  return { ok: true, fields };
}

/**
 * Paste-URL step 1: fetch product data for each URL and return editable
 * drafts. Nothing is saved yet. Admin-only, so no per-user rate limit —
 * the route's SSRF guards still apply per URL.
 */
export async function previewCatalogUrls(
  rawUrls: string[],
  defaultGender: Gender | null,
): Promise<Result<{ drafts: CatalogDraft[] }>> {
  const ctx = await adminClient();
  if (!ctx) return { ok: false, error: "Inte behörig." };

  const urls = Array.from(
    new Set(rawUrls.map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u))),
  ).slice(0, MAX_URLS_PER_PREVIEW);
  if (urls.length === 0) {
    return { ok: false, error: "Klistra in minst en länk som börjar med http(s)." };
  }

  const keys = urls.map(catalogUrlKey).filter((k): k is string => !!k);
  const { data: existing } = await ctx.supabase
    .from("catalog_items")
    .select("id, name, url_key")
    .in("url_key", keys);
  const byKey = new Map(
    (existing ?? []).map((r) => [r.url_key as string, { id: r.id, name: r.name }]),
  );

  const drafts: CatalogDraft[] = new Array(urls.length);
  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      const i = next++;
      drafts[i] = await draftFromUrl(urls[i], defaultGender, byKey);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);

  return { ok: true, drafts };
}

async function draftFromUrl(
  raw: string,
  defaultGender: Gender | null,
  byKey: Map<string, { id: string; name: string }>,
): Promise<CatalogDraft> {
  const base: CatalogDraft = {
    url: cleanBuyUrl(raw),
    brand: "",
    name: "",
    garment: "",
    gender: defaultGender,
    color: "",
    material: "",
    price: null,
    currency: "SEK",
    sourceImageUrl: "",
    retailer: null,
    retailerLocale: null,
    isAffiliate: false,
    affiliateNetwork: null,
    duplicateOf: byKey.get(catalogUrlKey(raw) ?? "") ?? null,
    warning: null,
  };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ...base, warning: "Ogiltig länk." };
  }
  if (!(await isHostnameSafe(url.hostname))) {
    return { ...base, warning: "Länken pekar på en otillåten adress." };
  }

  const meta = await previewProduct(url);
  const name = meta.product_name?.trim() ?? "";
  const draft: CatalogDraft = {
    ...base,
    brand: meta.brand?.trim() ?? "",
    name,
    garment: guessGarment(name) ?? guessGarment(url.pathname) ?? "",
    color: guessColor(meta.color, name, url.pathname) ?? "",
    price: typeof meta.price === "number" ? meta.price : null,
    currency: (meta.currency ?? "SEK").toUpperCase(),
    sourceImageUrl: meta.image_url ?? "",
    retailer: meta.retailer ?? null,
    retailerLocale: meta.retailer_locale ?? null,
    isAffiliate: meta.is_affiliate,
    affiliateNetwork: meta.affiliate_network,
  };
  if (!draft.name && !draft.sourceImageUrl) {
    draft.warning =
      "Sidan gav ingen produktdata. Fyll i manuellt och klistra in en bildlänk, eller lägg till plagget via uppladdning.";
  } else if (!draft.sourceImageUrl) {
    draft.warning = "Ingen bild hittades. Klistra in en bildlänk.";
  }
  return draft;
}

/** Paste-URL step 2: save one reviewed draft (image is copied to storage). */
export async function saveCatalogDraft(
  draft: CatalogDraft,
): Promise<Result<{ item: CatalogItem }>> {
  const ctx = await adminClient();
  if (!ctx) return { ok: false, error: "Inte behörig." };

  const cleaned = cleanFields({
    brand: draft.brand,
    name: draft.name,
    garment: draft.garment,
    gender: draft.gender,
    color: draft.color,
    material: draft.material,
    price: draft.price,
    currency: draft.currency,
    buyUrl: draft.url,
  });
  if (!cleaned.ok) return cleaned;
  if (!draft.sourceImageUrl.trim()) {
    return { ok: false, error: "Bild saknas." };
  }

  let stored: Awaited<ReturnType<typeof storeCatalogImage>>;
  try {
    stored = await storeCatalogImage(
      ctx.supabase,
      await downloadImage(draft.sourceImageUrl.trim()),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Bildfel." };
  }

  const row: CatalogInsert = {
    ...(cleaned.fields as CatalogInsert),
    image_url: stored.publicUrl,
    image_path: stored.path,
    image_bg: stored.background,
    source_image_url: draft.sourceImageUrl.trim().slice(0, 2000),
    retailer: draft.retailer?.slice(0, 64) ?? null,
    retailer_locale: draft.retailerLocale?.slice(0, 8) ?? null,
    is_affiliate: !!draft.isAffiliate,
    affiliate_network: draft.affiliateNetwork?.slice(0, 32) ?? null,
    created_by: ctx.userId,
  };
  return insertRow(ctx.supabase, row, stored.path);
}

/** Manual add: uploaded image + typed-in fields. */
export async function createCatalogItemFromUpload(
  formData: FormData,
): Promise<Result<{ item: CatalogItem }>> {
  const ctx = await adminClient();
  if (!ctx) return { ok: false, error: "Inte behörig." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Välj en bild." };
  }
  if (!ACCEPTED_UPLOADS.includes(file.type)) {
    return { ok: false, error: "Bilden måste vara JPG, PNG, WebP eller AVIF." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Bilden är för stor (max 10 MB)." };
  }

  const cleaned = cleanFields({
    brand: formData.get("brand"),
    name: formData.get("name"),
    garment: formData.get("garment"),
    gender: formData.get("gender"),
    color: formData.get("color"),
    material: formData.get("material"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    buyUrl: formData.get("buyUrl"),
  });
  if (!cleaned.ok) return cleaned;

  let stored: Awaited<ReturnType<typeof storeCatalogImage>>;
  try {
    stored = await storeCatalogImage(
      ctx.supabase,
      Buffer.from(await file.arrayBuffer()),
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Bildfel." };
  }

  return insertRow(
    ctx.supabase,
    {
      ...(cleaned.fields as CatalogInsert),
      image_url: stored.publicUrl,
      image_path: stored.path,
      image_bg: stored.background,
      created_by: ctx.userId,
    },
    stored.path,
  );
}

async function insertRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: CatalogInsert,
  imagePath: string,
): Promise<Result<{ item: CatalogItem }>> {
  const { data, error } = await supabase
    .from("catalog_items")
    .insert(row)
    .select(CATALOG_SELECT)
    .single();
  if (error || !data) {
    await supabase.storage.from("outfits").remove([imagePath]);
    if (error?.code === "23505") {
      return { ok: false, error: "Länken finns redan i plaggbanken." };
    }
    return { ok: false, error: `Kunde inte spara: ${error?.message ?? "okänt fel"}` };
  }
  revalidatePath("/admin/plagg");
  return { ok: true, item: toCatalogItem(data as CatalogRow) };
}

export async function updateCatalogItem(
  id: string,
  patch: {
    brand?: string;
    name?: string;
    garment?: string;
    gender?: Gender | null;
    color?: string | null;
    material?: string | null;
    price?: number | string | null;
    currency?: string;
    buyUrl?: string | null;
  },
): Promise<Result<{ item: CatalogItem }>> {
  const ctx = await adminClient();
  if (!ctx) return { ok: false, error: "Inte behörig." };
  if (!UUID_RE.test(id)) return { ok: false, error: "Ogiltigt id." };

  const cleaned = cleanFields(patch);
  if (!cleaned.ok) return cleaned;

  const { data, error } = await ctx.supabase
    .from("catalog_items")
    .update(cleaned.fields)
    .eq("id", id)
    .select(CATALOG_SELECT)
    .single();
  if (error || !data) {
    if (error?.code === "23505") {
      return { ok: false, error: "Ett annat plagg har redan den länken." };
    }
    return { ok: false, error: error?.message ?? "Kunde inte spara." };
  }
  revalidatePath("/admin/plagg");
  return { ok: true, item: toCatalogItem(data as CatalogRow) };
}

/** Swap the photo — from an uploaded file or a pasted image URL. */
export async function replaceCatalogImage(
  id: string,
  formData: FormData,
): Promise<Result<{ item: CatalogItem }>> {
  const ctx = await adminClient();
  if (!ctx) return { ok: false, error: "Inte behörig." };
  if (!UUID_RE.test(id)) return { ok: false, error: "Ogiltigt id." };

  const file = formData.get("image");
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  let source: Buffer;
  try {
    if (file instanceof File && file.size > 0) {
      if (!ACCEPTED_UPLOADS.includes(file.type) || file.size > MAX_UPLOAD_BYTES) {
        return { ok: false, error: "Bilden måste vara JPG/PNG/WebP/AVIF under 10 MB." };
      }
      source = Buffer.from(await file.arrayBuffer());
    } else if (imageUrl) {
      source = await downloadImage(imageUrl);
    } else {
      return { ok: false, error: "Välj en bild eller klistra in en bildlänk." };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Bildfel." };
  }

  const { data: before } = await ctx.supabase
    .from("catalog_items")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  let stored: Awaited<ReturnType<typeof storeCatalogImage>>;
  try {
    stored = await storeCatalogImage(ctx.supabase, source);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Bildfel." };
  }

  const { data, error } = await ctx.supabase
    .from("catalog_items")
    .update({
      image_url: stored.publicUrl,
      image_path: stored.path,
      image_bg: stored.background,
      ...(imageUrl ? { source_image_url: imageUrl.slice(0, 2000) } : {}),
    })
    .eq("id", id)
    .select(CATALOG_SELECT)
    .single();
  if (error || !data) {
    await ctx.supabase.storage.from("outfits").remove([stored.path]);
    return { ok: false, error: error?.message ?? "Kunde inte spara." };
  }
  // The old file stays when published outfit tags still point at it.
  if (before?.image_path) await removeImageIfUnused(ctx.supabase, before.image_path);

  revalidatePath("/admin/plagg");
  return { ok: true, item: toCatalogItem(data as CatalogRow) };
}

async function removeImageIfUnused(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string,
) {
  const { data: pub } = supabase.storage.from("outfits").getPublicUrl(path);
  const { count } = await supabase
    .from("tagged_items")
    .select("id", { count: "exact", head: true })
    .eq("image_url", pub.publicUrl);
  if (!count) await supabase.storage.from("outfits").remove([path]);
}

export async function setCatalogArchived(
  id: string,
  archived: boolean,
): Promise<Result> {
  const ctx = await adminClient();
  if (!ctx) return { ok: false, error: "Inte behörig." };
  if (!UUID_RE.test(id)) return { ok: false, error: "Ogiltigt id." };
  const { error } = await ctx.supabase
    .from("catalog_items")
    .update({ is_archived: archived })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/plagg");
  return { ok: true };
}

export async function deleteCatalogItem(id: string): Promise<Result> {
  const ctx = await adminClient();
  if (!ctx) return { ok: false, error: "Inte behörig." };
  if (!UUID_RE.test(id)) return { ok: false, error: "Ogiltigt id." };

  const { data: row } = await ctx.supabase
    .from("catalog_items")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();
  const { error } = await ctx.supabase.from("catalog_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  // Outfit tags keep working (catalog_item_id → null); their image_url may
  // still be this file, so only delete it when nothing references it.
  if (row?.image_path) await removeImageIfUnused(ctx.supabase, row.image_path);
  revalidatePath("/admin/plagg");
  return { ok: true };
}

/**
 * One batch of the "import garments from existing outfits" job. Picks tagged
 * items whose product isn't in the bank yet, copies their image and links
 * every tag with the same product URL to the new catalog row. The client
 * calls this repeatedly until `remaining` hits 0, passing back the tag ids
 * that failed so they aren't retried forever.
 */
export async function importTaggedItemsBatch(
  skipTagIds: string[],
): Promise<
  Result<{ imported: number; failed: Array<{ id: string; label: string; error: string }>; remaining: number }>
> {
  const ctx = await adminClient();
  if (!ctx) return { ok: false, error: "Inte behörig." };

  const [{ data: tags, error: tagErr }, { data: existing }] = await Promise.all([
    ctx.supabase
      .from("tagged_items")
      .select(
        "id, brand, name, garment, color, material, price, currency, buy_url, image_url, retailer, retailer_locale, is_affiliate, affiliate_network, catalog_item_id, outfits!inner(gender, vertical)",
      )
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(2000),
    ctx.supabase.from("catalog_items").select("id, url_key").limit(10000),
  ]);
  if (tagErr) return { ok: false, error: tagErr.message };

  type TagRow = {
    id: string;
    brand: string;
    name: string;
    garment: string;
    color: string | null;
    material: string | null;
    price: number | null;
    currency: string | null;
    buy_url: string | null;
    image_url: string | null;
    retailer: string | null;
    retailer_locale: string | null;
    is_affiliate: boolean;
    affiliate_network: string | null;
    catalog_item_id: string | null;
    outfits: { gender: Gender | null; vertical: string | null } | null;
  };

  const known = new Map((existing ?? []).map((r) => [r.url_key as string, r.id]));
  const skip = new Set(skipTagIds);
  const keyFor = (t: TagRow) =>
    catalogUrlKey(t.buy_url) ?? `img:${catalogUrlKey(t.image_url) ?? t.id}`;

  // Group pending tags by product so one catalog row covers duplicates.
  const groups = new Map<string, TagRow[]>();
  for (const t of (tags ?? []) as unknown as TagRow[]) {
    if (t.catalog_item_id || skip.has(t.id)) continue;
    if (t.outfits?.vertical === "hem") continue;
    const key = keyFor(t);
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }

  // Tags whose product already exists in the bank just need linking.
  for (const [key, list] of groups) {
    const existingId = known.get(key);
    if (existingId) {
      await ctx.supabase
        .from("tagged_items")
        .update({ catalog_item_id: existingId })
        .in("id", list.map((t) => t.id));
      groups.delete(key);
    }
  }

  const BATCH = 6;
  const batch = [...groups.entries()].slice(0, BATCH);
  let imported = 0;
  const failed: Array<{ id: string; label: string; error: string }> = [];

  await Promise.all(
    batch.map(async ([key, list]) => {
      const t = list[0];
      const label = `${t.brand} – ${t.name}`;
      try {
        const stored = await storeCatalogImage(
          ctx.supabase,
          await downloadImage(t.image_url!),
        );
        const { data, error } = await ctx.supabase
          .from("catalog_items")
          .insert({
            brand: t.brand.slice(0, 120),
            name: t.name.slice(0, 200),
            garment: t.garment.slice(0, 40),
            gender: t.outfits?.gender ?? null,
            color: guessColor(t.color, t.name) ?? t.color,
            material: t.material,
            price: t.price,
            currency: t.currency || "SEK",
            buy_url: t.buy_url,
            url_key: key.startsWith("img:") ? null : key,
            image_url: stored.publicUrl,
            image_path: stored.path,
            image_bg: stored.background,
            source_image_url: t.image_url,
            retailer: t.retailer,
            retailer_locale: t.retailer_locale,
            is_affiliate: t.is_affiliate,
            affiliate_network: t.affiliate_network,
            created_by: ctx.userId,
          })
          .select("id")
          .single();
        if (error || !data) {
          await ctx.supabase.storage.from("outfits").remove([stored.path]);
          throw new Error(error?.message ?? "Kunde inte spara.");
        }
        await ctx.supabase
          .from("tagged_items")
          .update({ catalog_item_id: data.id })
          .in("id", list.map((x) => x.id));
        imported++;
      } catch (e) {
        for (const x of list) {
          failed.push({
            id: x.id,
            label,
            error: e instanceof Error ? e.message : "Fel",
          });
        }
      }
    }),
  );

  revalidatePath("/admin/plagg");
  return {
    ok: true,
    imported,
    failed,
    remaining: Math.max(0, groups.size - batch.length),
  };
}

interface FlatlayTagInput {
  brand: string;
  name: string;
  buyUrl: string;
  garment: string;
  price?: number | null;
  currency?: string | null;
  color?: string | null;
  material?: string | null;
  imageUrl?: string | null;
  x: number;
  y: number;
  isAffiliate?: boolean;
  catalogItemId?: string | null;
}

/**
 * Save an edited Snabb-outfit flatlay in place: new rendered image, layout,
 * title/category/gender/description, and tags. Tags are matched to the
 * existing rows by catalog item, so unchanged garments keep their id (and
 * their click history); removed garments are deleted, new ones inserted.
 */
export async function updateFlatlayOutfit(
  outfitId: string,
  formData: FormData,
): Promise<Result<{ url: string }>> {
  const ctx = await adminClient();
  if (!ctx) return { ok: false, error: "Inte behörig." };
  if (!UUID_RE.test(outfitId)) return { ok: false, error: "Ogiltigt id." };

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0 || image.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Bilden saknas eller är för stor." };
  }
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  if (!title) return { ok: false, error: "Titel saknas." };
  const description = String(formData.get("description") ?? "").trim().slice(0, 2000);
  const category = String(formData.get("category") ?? "").trim() || null;
  const gender = formData.get("gender") === "dam" ? "dam" : "herr";
  const layout = parseBuilderLayout(formData.get("builderLayout"));
  if (!layout) return { ok: false, error: "Ogiltig layout." };

  let tags: FlatlayTagInput[];
  try {
    const parsed = JSON.parse(String(formData.get("tags") ?? "[]"));
    if (!Array.isArray(parsed)) throw new Error();
    tags = parsed.filter((t) => t && String(t.brand ?? "").trim() && String(t.name ?? "").trim());
  } catch {
    return { ok: false, error: "Kunde inte läsa taggarna." };
  }

  const { data: outfit } = await ctx.supabase
    .from("outfits")
    .select("id, user_id, slug, title, image_path, profiles!outfits_user_id_fkey(username)")
    .eq("id", outfitId)
    .maybeSingle();
  if (!outfit) return { ok: false, error: "Outfiten finns inte." };

  const path = storageFilename({
    userId: outfit.user_id as string,
    slug: slugify((outfit.slug as string) || title),
    ext: "jpg",
    prefix: "flatlay",
  });
  const { error: upErr } = await ctx.supabase.storage
    .from("outfits")
    .upload(path, image, { contentType: "image/jpeg", upsert: false });
  if (upErr) return { ok: false, error: `Uppladdning misslyckades: ${upErr.message}` };
  const {
    data: { publicUrl },
  } = ctx.supabase.storage.from("outfits").getPublicUrl(path);

  const { error: updErr } = await ctx.supabase
    .from("outfits")
    .update({
      image_url: publicUrl,
      image_path: path,
      title,
      description: description || null,
      category,
      gender,
      type: "flatlay",
      builder_layout: JSON.parse(JSON.stringify(layout)),
    })
    .eq("id", outfitId);
  if (updErr) {
    await ctx.supabase.storage.from("outfits").remove([path]);
    return { ok: false, error: updErr.message };
  }

  // Sync tags.
  const { data: existing } = await ctx.supabase
    .from("tagged_items")
    .select("id, catalog_item_id")
    .eq("outfit_id", outfitId);
  const byCatalog = new Map(
    (existing ?? [])
      .filter((t) => t.catalog_item_id)
      .map((t) => [t.catalog_item_id as string, t.id as string]),
  );
  const keep = new Set<string>();
  const clampPct = (n: unknown) =>
    Math.min(100, Math.max(0, Number.isFinite(Number(n)) ? Number(n) : 50));
  const toRow = (t: FlatlayTagInput) => ({
    brand: String(t.brand).trim().slice(0, 120),
    name: String(t.name).trim().slice(0, 200),
    buy_url: String(t.buyUrl ?? "").trim() || null,
    garment: String(t.garment || "Tops").slice(0, 40),
    price: typeof t.price === "number" && Number.isFinite(t.price) && t.price >= 0 ? t.price : null,
    currency: t.currency?.trim().toUpperCase().slice(0, 8) || "SEK",
    color: t.color?.trim().slice(0, 40) || null,
    material: t.material?.trim().slice(0, 60) || null,
    image_url: t.imageUrl?.trim().slice(0, 1000) || null,
    position_x: clampPct(t.x),
    position_y: clampPct(t.y),
    is_affiliate: !!t.isAffiliate,
    catalog_item_id:
      t.catalogItemId && UUID_RE.test(t.catalogItemId) ? t.catalogItemId : null,
  });
  const inserts = [];
  for (const t of tags) {
    const row = toRow(t);
    const existingId = row.catalog_item_id ? byCatalog.get(row.catalog_item_id) : undefined;
    if (existingId && !keep.has(existingId)) {
      keep.add(existingId);
      await ctx.supabase.from("tagged_items").update(row).eq("id", existingId);
    } else {
      inserts.push({ ...row, outfit_id: outfitId });
    }
  }
  const remove = (existing ?? []).map((t) => t.id as string).filter((id) => !keep.has(id));
  if (remove.length > 0) await ctx.supabase.from("tagged_items").delete().in("id", remove);
  if (inserts.length > 0) {
    const { error } = await ctx.supabase.from("tagged_items").insert(inserts);
    if (error) console.error("flatlay tag insert failed:", error);
  }

  // The previous render is no longer referenced by anything.
  if (outfit.image_path && outfit.image_path !== path) {
    await ctx.supabase.storage.from("outfits").remove([outfit.image_path as string]);
  }

  const username = (outfit.profiles as { username?: string } | null)?.username?.toLowerCase();
  const url = username && outfit.slug ? `/${username}/${outfit.slug}` : `/outfit/${outfitId}`;
  revalidatePath(url);
  revalidatePath(`/outfit/${outfitId}`);
  revalidatePath("/admin/inlagg");
  revalidatePath(`/admin/inlagg/${outfitId}`);
  return { ok: true, url };
}
