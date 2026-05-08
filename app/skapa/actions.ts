"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface CreateOutfitState {
  error?: string;
}

interface TagInput {
  brand: string;
  name: string;
  buyUrl: string;
  garment: string;
  x: number;
  y: number;
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

  // Upload image. Path must start with user.id for storage RLS to allow it.
  const ext = image.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
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

  const { data: outfit, error: outfitError } = await supabase
    .from("outfits")
    .insert({
      user_id: user.id,
      image_url: publicUrl,
      image_path: path,
      title,
      description: description || null,
      category: category || null,
      gender,
      type: "photo",
    })
    .select("id")
    .single();

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
        garment: t.garment || "Toppar",
        position_x: t.x,
        position_y: t.y,
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

  redirect(`/outfit/${outfit.id}`);
}
