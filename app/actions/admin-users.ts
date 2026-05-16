"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  isCurrentUserAdmin,
  IMPERSONATION_COOKIE,
} from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export async function startImpersonation(
  targetUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Inte behörig." };
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", targetUserId)
    .maybeSingle();
  if (!target) return { ok: false, error: "Användaren finns inte." };

  const jar = await cookies();
  jar.set(IMPERSONATION_COOKIE, targetUserId, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function stopImpersonation(): Promise<{ ok: true }> {
  const jar = await cookies();
  jar.delete(IMPERSONATION_COOKIE);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleAdmin(
  userId: string,
): Promise<{ ok: true; isAdmin: boolean } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Inte behörig." };
  }

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Användaren finns inte." };

  const next = !row.is_admin;
  const { error } = await supabase
    .from("profiles")
    .update({ is_admin: next })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/anvandare");
  return { ok: true, isAdmin: next };
}

export async function deleteUserAccount(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Inte behörig." };
  }

  // Service-role required to drop the auth.users row. Without it we'd
  // leave an orphan auth record + a deleted profile.
  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "SUPABASE_SERVICE_ROLE_KEY behövs för att radera konton.",
    };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/anvandare");
  return { ok: true };
}

interface DummySpec {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
}

const DUMMY_CREATORS: DummySpec[] = [
  {
    username: "elinwong",
    displayName: "Elin Wong",
    bio: "Stockholmsbaserad stylist. Bygger garderoben kring tre färger.",
    avatarUrl: "https://i.pravatar.cc/300?img=10",
  },
  {
    username: "klaracarlsson",
    displayName: "Klara Carlsson",
    bio: "Slow fashion, vintage-tunga lager, allt under ett kort.",
    avatarUrl: "https://i.pravatar.cc/300?img=11",
  },
  {
    username: "viggoholm",
    displayName: "Viggo Holm",
    bio: "Skor, tailoring, en vinyl-skiva i handen.",
    avatarUrl: "https://i.pravatar.cc/300?img=12",
  },
  {
    username: "ninapettersson",
    displayName: "Nina Pettersson",
    bio: "Minimalism för verkliga liv. Linne, ull, läder.",
    avatarUrl: "https://i.pravatar.cc/300?img=13",
  },
  {
    username: "felixberg",
    displayName: "Felix Berg",
    bio: "Streetwear ur ett nordiskt perspektiv.",
    avatarUrl: "https://i.pravatar.cc/300?img=14",
  },
  {
    username: "majagrahn",
    displayName: "Maja Grahn",
    bio: "Klänningar, lager, en kopp kaffe.",
    avatarUrl: "https://i.pravatar.cc/300?img=15",
  },
  {
    username: "leonardlowe",
    displayName: "Leonard Löwe",
    bio: "Workwear möter Stockholms vinter.",
    avatarUrl: "https://i.pravatar.cc/300?img=16",
  },
  {
    username: "amanda_h",
    displayName: "Amanda Hellström",
    bio: "Färg som signatur. Mjuk skärning, hårda accessoarer.",
    avatarUrl: "https://i.pravatar.cc/300?img=17",
  },
  {
    username: "sagabohlin",
    displayName: "Saga Bohlin",
    bio: "Stillsamma toner, hantverk, en kopp espresso.",
    avatarUrl: "https://i.pravatar.cc/300?img=20",
  },
  {
    username: "hugolindqvist",
    displayName: "Hugo Lindqvist",
    bio: "Tailoring för verkliga liv. Ull och linne.",
    avatarUrl: "https://i.pravatar.cc/300?img=33",
  },
];

const USERNAME_RE = /^[a-z0-9_]{2,30}$/;

export async function updateUserProfile(
  userId: string,
  patch: {
    username?: string;
    display_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    region?: string | null;
    instagram?: string | null;
    tiktok?: string | null;
    youtube?: string | null;
    website?: string | null;
    brand_name?: string | null;
    brand_website?: string | null;
    account_type?: "creator" | "brand" | null;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Inte behörig." };
  }

  const updates: ProfileUpdate = {};

  if (patch.username !== undefined) {
    const u = patch.username.trim().toLowerCase();
    if (!USERNAME_RE.test(u)) {
      return {
        ok: false,
        error:
          "Användarnamn måste vara 2–30 tecken, bara a–z, 0–9 och _.",
      };
    }
    const { isReservedUsername } = await import("@/lib/reserved-usernames");
    if (isReservedUsername(u)) {
      return { ok: false, error: "Användarnamnet är reserverat." };
    }
    updates.username = u;
  }
  if (patch.display_name !== undefined) {
    const d = patch.display_name?.trim() ?? null;
    updates.display_name = d && d.length > 0 ? d.slice(0, 80) : null;
  }
  if (patch.bio !== undefined) {
    const b = patch.bio?.trim() ?? null;
    updates.bio = b && b.length > 0 ? b.slice(0, 500) : null;
  }
  if (patch.avatar_url !== undefined) {
    const a = patch.avatar_url?.trim() ?? null;
    if (a && !/^https?:\/\//i.test(a)) {
      return { ok: false, error: "Avatar-URL måste börja med http(s)://" };
    }
    updates.avatar_url = a && a.length > 0 ? a : null;
  }
  if (patch.region !== undefined) {
    const r = patch.region?.trim().toUpperCase();
    // region is NOT NULL in DB with default 'SE'; falling back keeps the
    // constraint happy when admin clears the field.
    updates.region = r && r.length > 0 ? r.slice(0, 8) : "SE";
  }
  for (const key of [
    "instagram",
    "tiktok",
    "youtube",
    "website",
    "brand_name",
    "brand_website",
  ] as const) {
    if (patch[key] !== undefined) {
      const v = patch[key]?.trim() ?? null;
      updates[key] = v && v.length > 0 ? v : null;
    }
  }
  if (patch.account_type !== undefined) {
    if (patch.account_type === "creator" || patch.account_type === "brand") {
      updates.account_type = patch.account_type;
    }
  }

  if (Object.keys(updates).length === 0) {
    return { ok: true };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Användarnamnet är upptaget." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/anvandare");
  revalidatePath(`/admin/anvandare/${userId}`);
  if (updates.username) revalidatePath(`/profile/${updates.username}`);
  return { ok: true };
}

const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export async function uploadUserAvatar(
  userId: string,
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Inte behörig." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Välj en bild." };
  }
  if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
    return { ok: false, error: "Bilden måste vara JPG, PNG eller WebP." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "Bilden är för stor (max 5 MB)." };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  // Path lives under the target user's folder so the file is owned by them.
  // Admin storage policy from 0027 allows the write.
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return {
      ok: false,
      error: `Uppladdning misslyckades: ${uploadError.message}`,
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: profErr } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);

  if (profErr) {
    await supabase.storage.from("avatars").remove([path]);
    return { ok: false, error: profErr.message };
  }

  revalidatePath("/admin/anvandare");
  revalidatePath(`/admin/anvandare/${userId}`);
  return { ok: true, url: publicUrl };
}

export async function createDummyCreator(input: {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "Inte behörig." };
  }

  const username = input.username.trim().toLowerCase();
  if (!USERNAME_RE.test(username)) {
    return {
      ok: false,
      error: "Användarnamn måste vara 2–30 tecken, bara a–z, 0–9 och _.",
    };
  }
  const { isReservedUsername } = await import("@/lib/reserved-usernames");
  if (isReservedUsername(username)) {
    return { ok: false, error: "Användarnamnet är reserverat." };
  }

  const displayName = input.displayName.trim();
  if (!displayName) return { ok: false, error: "Namn saknas." };

  const avatarUrl = input.avatarUrl.trim();
  if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
    return { ok: false, error: "Avatar-URL måste börja med http(s)://" };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "SUPABASE_SERVICE_ROLE_KEY saknas i Vercel/env.",
    };
  }

  // Verify the username isn't already taken before we burn an auth row.
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) return { ok: false, error: "Användarnamnet är upptaget." };

  const email = `${username}@demo.moidello.com`;
  const { data: createdUser, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password: crypto.randomUUID() + "Aa1!",
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        avatar_url: avatarUrl || null,
      },
    });

  if (authError || !createdUser.user) {
    return {
      ok: false,
      error: authError?.message ?? "Kunde inte skapa konto.",
    };
  }

  const { error: profErr } = await admin
    .from("profiles")
    .update({
      username,
      display_name: displayName,
      avatar_url: avatarUrl || null,
      bio: input.bio?.trim() || null,
      account_type: "creator",
      is_demo: true,
    })
    .eq("id", createdUser.user.id);

  if (profErr) {
    return {
      ok: false,
      error: `Profile-uppdatering misslyckades: ${profErr.message}`,
    };
  }

  revalidatePath("/admin/anvandare");
  return { ok: true };
}

export async function seedDummyCreators(): Promise<{
  ok: true;
  created: number;
  skipped: number;
  errors: string[];
}> {
  if (!(await isCurrentUserAdmin())) {
    return {
      ok: true,
      created: 0,
      skipped: 0,
      errors: ["Inte behörig."],
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return {
      ok: true,
      created: 0,
      skipped: 0,
      errors: [
        e instanceof Error
          ? e.message
          : "Service role-nyckel saknas — sätt SUPABASE_SERVICE_ROLE_KEY i Vercel.",
      ],
    };
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const spec of DUMMY_CREATORS) {
    // Skip if username already exists.
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("username", spec.username)
      .maybeSingle();
    if (existing) {
      skipped++;
      continue;
    }

    const email = `${spec.username}@demo.moidello.com`;
    const { data: created_user, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password: crypto.randomUUID() + "Aa1!",
        email_confirm: true,
        user_metadata: {
          display_name: spec.displayName,
          avatar_url: spec.avatarUrl,
        },
      });

    if (authError || !created_user.user) {
      errors.push(`${spec.username}: ${authError?.message ?? "okänt fel"}`);
      continue;
    }

    // The handle_new_user trigger inserts a default profile row. Update it
    // with the chosen username/display name/avatar.
    const { error: profErr } = await admin
      .from("profiles")
      .update({
        username: spec.username,
        display_name: spec.displayName,
        avatar_url: spec.avatarUrl,
        bio: spec.bio,
        account_type: "creator",
        is_demo: true,
      })
      .eq("id", created_user.user.id);

    if (profErr) {
      errors.push(`${spec.username}: profile update ${profErr.message}`);
      continue;
    }

    created++;
  }

  revalidatePath("/admin/anvandare");
  return { ok: true, created, skipped, errors };
}
