"use server";

import { createClient } from "@/lib/supabase/server";
import { slugify, storageFilename } from "@/lib/slug";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_BULK_ITEMS = 10;

export interface BulkResult {
  ok: boolean;
  created: Array<{ slug: string | null; id: string; title: string }>;
  errors: Array<{ index: number; message: string }>;
  redirectUsername: string | null;
}

interface ItemMeta {
  title: string;
  category: string;
  gender: "dam" | "herr";
}

export async function createOutfitsBatch(
  formData: FormData,
): Promise<BulkResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      created: [],
      errors: [{ index: -1, message: "Du måste logga in först." }],
      redirectUsername: null,
    };
  }

  let metaList: ItemMeta[];
  try {
    metaList = JSON.parse(
      (formData.get("meta") as string | null) ?? "[]",
    ) as ItemMeta[];
  } catch {
    return {
      ok: false,
      created: [],
      errors: [{ index: -1, message: "Ogiltig metadata." }],
      redirectUsername: null,
    };
  }

  const files = formData.getAll("images").filter((v): v is File => v instanceof File);

  if (files.length === 0) {
    return {
      ok: false,
      created: [],
      errors: [{ index: -1, message: "Välj minst en bild." }],
      redirectUsername: null,
    };
  }

  if (files.length > MAX_BULK_ITEMS) {
    return {
      ok: false,
      created: [],
      errors: [
        {
          index: -1,
          message: `Max ${MAX_BULK_ITEMS} bilder per uppladdning.`,
        },
      ],
      redirectUsername: null,
    };
  }

  if (metaList.length !== files.length) {
    return {
      ok: false,
      created: [],
      errors: [
        { index: -1, message: "Metadata matchar inte antal bilder." },
      ],
      redirectUsername: null,
    };
  }

  const created: BulkResult["created"] = [];
  const errors: BulkResult["errors"] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const meta = metaList[i];

    if (file.size === 0) {
      errors.push({ index: i, message: "Tom bild." });
      continue;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      errors.push({ index: i, message: "Bilden måste vara JPG, PNG eller WebP." });
      continue;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      errors.push({ index: i, message: "Bilden är för stor (max 10 MB)." });
      continue;
    }
    const title = meta.title?.trim();
    if (!title) {
      errors.push({ index: i, message: "Titel saknas." });
      continue;
    }
    if (meta.gender !== "dam" && meta.gender !== "herr") {
      errors.push({ index: i, message: "Välj kön." });
      continue;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = storageFilename({
      userId: user.id,
      slug: slugify(title),
      ext,
    });

    const { error: uploadError } = await supabase.storage
      .from("outfits")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      errors.push({
        index: i,
        message: `Bilduppladdning misslyckades: ${uploadError.message}`,
      });
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("outfits").getPublicUrl(path);

    const baseSlug = slugify(title);
    let chosenSlug = baseSlug || "outfit";
    let outfitInsert: { id: string; slug: string | null } | null = null;
    let outfitError: { code?: string; message?: string } | null = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from("outfits")
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          image_path: path,
          title,
          slug: chosenSlug,
          description: null,
          category: meta.category || null,
          gender: meta.gender,
          type: "photo",
        })
        .select("id, slug")
        .single();

      if (!error && data) {
        outfitInsert = data as { id: string; slug: string | null };
        outfitError = null;
        break;
      }
      if (error?.code === "23505" && attempt < 4) {
        const suffix = Math.random().toString(36).slice(2, 6);
        chosenSlug = `${baseSlug || "outfit"}-${suffix}`;
        outfitError = error;
        continue;
      }
      outfitError = error ?? null;
      break;
    }

    if (outfitError || !outfitInsert) {
      await supabase.storage.from("outfits").remove([path]);
      errors.push({
        index: i,
        message: `Kunde inte spara outfit: ${outfitError?.message ?? "okänt fel"}`,
      });
      continue;
    }

    created.push({ id: outfitInsert.id, slug: outfitInsert.slug, title });
  }

  let username: string | null = null;
  if (created.length > 0) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    username = (profileRow?.username as string | undefined) ?? null;
  }

  return {
    ok: created.length > 0,
    created,
    errors,
    redirectUsername: username ? username.toLowerCase() : null,
  };
}
