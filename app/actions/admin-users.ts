"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  isCurrentUserAdmin,
  IMPERSONATION_COOKIE,
} from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

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
];

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
