"use server";

import { createClient } from "@/lib/supabase/server";
import { slugify, storageFilename } from "@/lib/slug";
import { getImpersonationTarget } from "@/lib/admin";

export interface PublishedOutfit {
  id: string;
  slug: string | null;
  title: string;
  username: string | null;
  url: string;
}

export interface CreateOutfitState {
  error?: string;
  success?: PublishedOutfit;
  /** Bumped on every successful publish so the client can reset the form
   *  even when a user publishes two outfits in a row with the same title. */
  nonce?: number;
}

interface TagInput {
  brand: string;
  name: string;
  buyUrl: string;
  buyUrls?: Record<string, string>;
  garment: string;
  x: number;
  y: number;
  isAffiliate?: boolean;
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function createOutfit(
  _prev: CreateOutfitState,
  formData: FormData,
): Promise<CreateOutfitState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Du måste logga in först." };

  // If an admin is impersonating someone, write the new outfit under that
  // user's id. RLS lets admins do this via the policies added in 0026.
  const impersonation = await getImpersonationTarget();
  const writerId = impersonation?.targetUserId ?? user.id;

  const image = formData.get("image");
  const title = (formData.get("title") as string | null)?.trim();
  const description = ((formData.get("description") as string | null) ?? "").trim();
  const category = (formData.get("category") as string | null) ?? "";
  const gender = (formData.get("gender") as string | null) ?? "dam";
  const tagsRaw = (formData.get("tags") as string | null) ?? "[]";

  if (!(image instanceof File) || image.size === 0) {
    return { error: "Välj en bild." };
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
    return { error: "Bilden måste vara JPG, PNG eller WebP." };
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return { error: "Bilden är för stor (max 10 MB)." };
  }
  if (!title) {
    return { error: "Skriv en titel." };
  }
  if (gender !== "dam" && gender !== "herr") {
    return { error: "Välj kön." };
  }

  let tags: TagInput[];
  try {
    tags = JSON.parse(tagsRaw);
  } catch {
    return { error: "Kunde inte tolka taggar." };
  }

  // Upload image. Path lives under the target user (impersonated or self)
  // so files cluster by the actual owner, not the admin who pasted them.
  // Storage policy "Admins upload anywhere" makes this writable.
  const ext = image.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = storageFilename({
    userId: writerId,
    slug: slugify(title),
    ext,
  });
  const { error: uploadError } = await supabase.storage
    .from("outfits")
    .upload(path, image, {
      contentType: image.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: `Bilduppladdning misslyckades: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("outfits").getPublicUrl(path);

  // Generate the URL slug. Try the clean form first; on uniqueness
  // collision append a 4-char hash so we land on something like
  // "venice-cardigan-a3f9". Cap retries to avoid infinite loops.
  const baseSlug = slugify(title);
  let chosenSlug = baseSlug || "outfit";
  let outfitInsert:
    | { id: string; slug: string | null }
    | null = null;
  let outfitError: { code?: string; message?: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("outfits")
      .insert({
        user_id: writerId,
        image_url: publicUrl,
        image_path: path,
        title,
        slug: chosenSlug,
        description: description || null,
        category: category || null,
        gender,
        type: "photo",
      })
      .select("id, slug")
      .single();

    if (!error && data) {
      outfitInsert = data as { id: string; slug: string | null };
      outfitError = null;
      break;
    }
    // 23505 = unique_violation
    if (error?.code === "23505" && attempt < 4) {
      const suffix = Math.random().toString(36).slice(2, 6);
      chosenSlug = `${baseSlug || "outfit"}-${suffix}`;
      outfitError = error;
      continue;
    }
    outfitError = error ?? null;
    break;
  }

  const outfit = outfitInsert;

  if (outfitError || !outfit) {
    await supabase.storage.from("outfits").remove([path]);
    return {
      error: `Kunde inte spara outfit: ${outfitError?.message ?? "okänt fel"}`,
    };
  }

  if (tags.length > 0) {
    const taggedRows = tags
      .filter((t) => t.brand.trim() && t.name.trim())
      .map((t) => ({
        outfit_id: outfit.id,
        brand: t.brand.trim(),
        name: t.name.trim(),
        buy_url: t.buyUrl.trim() || null,
        buy_urls:
          t.buyUrls && Object.keys(t.buyUrls).length > 0 ? t.buyUrls : null,
        garment: t.garment || "Toppar",
        position_x: t.x,
        position_y: t.y,
        is_affiliate: !!t.isAffiliate,
      }));

    if (taggedRows.length > 0) {
      const { error: tagError } = await supabase
        .from("tagged_items")
        .insert(taggedRows);
      if (tagError) {
        console.error("tagged_items insert failed:", tagError);
      }
    }
  }

  // Return a success payload so the client can decide whether to stay on
  // /skapa for another upload or navigate to the new outfit. Username is
  // fetched for the writer (impersonated or self) so canonical URLs land
  // under the actual outfit owner.
  let username: string | null = null;
  if (outfit.slug) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", writerId)
      .maybeSingle();
    username = (profileRow?.username as string | undefined)?.toLowerCase() ?? null;
  }

  const url =
    username && outfit.slug
      ? `/${username}/${outfit.slug}`
      : `/outfit/${outfit.id}`;

  return {
    success: {
      id: outfit.id,
      slug: outfit.slug,
      title,
      username,
      url,
    },
    nonce: Date.now(),
  };
}
