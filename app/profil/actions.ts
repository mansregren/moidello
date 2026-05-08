"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProfileUpdateState {
  ok?: boolean;
  error?: string;
  fieldErrors?: { username?: string; displayName?: string; bio?: string };
}

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

export async function updateProfile(
  _prev: ProfileUpdateState,
  formData: FormData,
): Promise<ProfileUpdateState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du måste logga in först." };

  const username = ((formData.get("username") as string | null) ?? "")
    .trim()
    .toLowerCase();
  const displayName =
    ((formData.get("display_name") as string | null) ?? "").trim() || null;
  const bio = ((formData.get("bio") as string | null) ?? "").trim() || null;
  const region =
    ((formData.get("region") as string | null) ?? "SE").trim().toUpperCase() ||
    "SE";
  const accountType =
    (formData.get("account_type") as string | null) === "brand"
      ? "brand"
      : "creator";
  const brandName = ((formData.get("brand_name") as string | null) ?? "").trim();
  const brandWebsite = ((formData.get("brand_website") as string | null) ?? "")
    .trim();
  const avatar = formData.get("avatar");

  if (!USERNAME_RE.test(username)) {
    return {
      fieldErrors: {
        username: "3–24 tecken: små bokstäver, siffror, understreck.",
      },
    };
  }

  if (bio && bio.length > 500) {
    return { fieldErrors: { bio: "För lång bio (max 500 tecken)." } };
  }

  if (accountType === "brand" && brandName.length === 0) {
    return { error: "Märkets namn krävs för ett brand-konto." };
  }
  if (brandWebsite && !/^https?:\/\//i.test(brandWebsite)) {
    return { error: "Webbsidan måste börja med http:// eller https://" };
  }

  // Username collision check (skip our own row).
  const { data: collision } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();
  if (collision) {
    return { fieldErrors: { username: "Användarnamnet är upptaget." } };
  }

  let avatarUrl: string | null = null;
  if (avatar instanceof File && avatar.size > 0) {
    if (!ACCEPTED_IMAGE_TYPES.includes(avatar.type)) {
      return { error: "Avataren måste vara JPG, PNG eller WebP." };
    }
    if (avatar.size > MAX_AVATAR_BYTES) {
      return { error: "Avataren är för stor (max 5 MB)." };
    }
    const ext = avatar.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatar, { contentType: avatar.type, upsert: false });
    if (uploadError) {
      return { error: `Avataruppladdning misslyckades: ${uploadError.message}` };
    }
    avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data
      .publicUrl;
  }

  // The on_auth_user_created trigger seeds a profile row when the auth user
  // is created, so the typical path is a plain UPDATE. We INSERT as a
  // fallback only if the row is genuinely missing (trigger never ran, or
  // the row was deleted). UPDATE-then-INSERT plays nicer with RLS than a
  // single upsert because each path hits exactly one policy.
  const fields: Record<string, unknown> = {
    username,
    display_name: displayName,
    bio,
    region,
    account_type: accountType,
    brand_name: accountType === "brand" ? brandName : null,
    brand_website:
      accountType === "brand" ? (brandWebsite || null) : null,
  };
  if (avatarUrl) fields.avatar_url = avatarUrl;

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", user.id)
    .select("id");

  if (updateError) {
    return { error: `Kunde inte spara profilen: ${updateError.message}` };
  }

  if (!updated || updated.length === 0) {
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({ id: user.id, ...fields });
    if (insertError) {
      return { error: `Kunde inte skapa profilen: ${insertError.message}` };
    }
  }

  revalidatePath("/profil");
  revalidatePath(`/profile/${username}`);
  return { ok: true };
}
