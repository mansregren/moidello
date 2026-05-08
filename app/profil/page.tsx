"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  X,
  Bell,
  Lock,
  HelpCircle,
  Info,
  LogOut,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { UserAvatar } from "@/components/user/UserAvatar";
import { useAuth } from "@/lib/auth-context";
import { useGender, matchesGenderFilter } from "@/lib/gender-context";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Outfit, User as MoidelloUser } from "@/lib/types";
import { ProfileEditSheet } from "./ProfileEditSheet";
import { ShareButton } from "@/components/shared/ShareButton";
import { SocialLinks } from "@/components/user/SocialLinks";

type ProfileTab = "outfits" | "saved" | "about";

interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  region: string;
  account_type?: "creator" | "brand";
  brand_name?: string | null;
  brand_website?: string | null;
}

export default function ProfilPage() {
  const router = useRouter();
  const { gender } = useGender();
  const { user, isLoggedIn, loading, signOut } = useAuth();
  const [tab, setTab] = useState<ProfileTab>("outfits");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [profile, setProfile] = useState<MoidelloUser | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push("/login");
    }
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      setProfileLoading(true);

      const [{ data: profileRow }, { data: statsRow }, { data: outfitRows }, { data: saveRows }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, username, display_name, avatar_url, bio, region, account_type, brand_name, brand_website",
            )
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("profile_stats")
            .select("outfits, followers, following")
            .eq("profile_id", user.id)
            .maybeSingle(),
          supabase
            .from("outfits")
            .select(
              "id, user_id, image_url, type, gender, title, description, category, created_at",
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("saves")
            .select(
              "outfit:outfits(id, user_id, image_url, type, gender, title, description, category, created_at, profiles(id, username, display_name, avatar_url))",
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

      if (cancelled) return;

      // Build a creator object now (synchronously) so we don't rely on the
      // useState `profile` value, which is null on first render.
      const fallbackUsername =
        user.email?.split("@")[0]?.replace(/[^a-z0-9_]/gi, "_").toLowerCase() ??
        "user";
      const resolved: MoidelloUser = profileRow
        ? {
            id: profileRow.id,
            username: profileRow.username,
            displayName: profileRow.display_name ?? profileRow.username,
            avatar: profileRow.avatar_url ?? "",
            bio: profileRow.bio ?? "",
            followers: statsRow?.followers ?? 0,
            following: statsRow?.following ?? 0,
            outfitCount: statsRow?.outfits ?? 0,
            region: (profileRow as ProfileRow).region,
            accountType: (profileRow as ProfileRow).account_type ?? "creator",
            brandName: (profileRow as ProfileRow).brand_name ?? undefined,
            brandWebsite:
              (profileRow as ProfileRow).brand_website ?? undefined,
          }
        : {
            id: user.id,
            username: fallbackUsername,
            displayName:
              (user.user_metadata?.display_name as string | undefined) ??
              fallbackUsername,
            avatar: (user.user_metadata?.avatar_url as string | undefined) ?? "",
            bio: "",
            followers: 0,
            following: 0,
            outfitCount: 0,
          };
      setProfile(resolved);

      if (outfitRows) {
        setOutfits(
          outfitRows.map((o) => ({
            id: o.id,
            image: o.image_url,
            type: o.type as Outfit["type"],
            gender: o.gender as Outfit["gender"],
            title: o.title,
            description: o.description ?? "",
            creator: resolved,
            tags: [],
            likes: 0,
            saves: 0,
            comments: [],
            category: o.category ?? "",
            createdAt: o.created_at,
          })),
        );
      }

      if (saveRows) {
        type SaveJoin = {
          outfit:
            | (Outfit & {
                user_id: string;
                image_url: string;
                profiles: ProfileRow | null;
              })
            | null;
        };
        const rows = saveRows as unknown as SaveJoin[];
        setSavedOutfits(
          rows
            .map((r) => r.outfit)
            .filter(Boolean)
            .map((o) => {
              const out = o as unknown as {
                id: string;
                user_id: string;
                image_url: string;
                type: Outfit["type"];
                gender: Outfit["gender"];
                title: string;
                description: string | null;
                category: string | null;
                created_at: string;
                profiles: ProfileRow | null;
              };
              const creator = out.profiles
                ? {
                    id: out.profiles.id,
                    username: out.profiles.username,
                    displayName:
                      out.profiles.display_name ?? out.profiles.username,
                    avatar: out.profiles.avatar_url ?? "",
                    bio: out.profiles.bio ?? "",
                    followers: 0,
                    following: 0,
                    outfitCount: 0,
                  }
                : {
                    id: out.user_id,
                    username: "",
                    displayName: "",
                    avatar: "",
                    bio: "",
                    followers: 0,
                    following: 0,
                    outfitCount: 0,
                  };
              return {
                id: out.id,
                image: out.image_url,
                type: out.type,
                gender: out.gender,
                title: out.title,
                description: out.description ?? "",
                creator,
                tags: [],
                likes: 0,
                saves: 0,
                comments: [],
                category: out.category ?? "",
                createdAt: out.created_at,
              } satisfies Outfit;
            }),
        );
      }

      // Fetch which outfits in this view the user has liked, so the heart
      // shows the correct filled state on the user's own + saved outfits.
      const allIds = [
        ...(outfitRows?.map((o) => o.id) ?? []),
      ];
      // Type narrows: saveRows is optional, the outfit join may be null.
      type SaveJoinIds = { outfit: { id: string } | null };
      const savedIds = ((saveRows ?? []) as unknown as SaveJoinIds[])
        .map((r) => r.outfit?.id)
        .filter((id): id is string => !!id);
      allIds.push(...savedIds);

      if (allIds.length > 0) {
        const { data: likeRows } = await supabase
          .from("likes")
          .select("outfit_id")
          .eq("user_id", user.id)
          .in("outfit_id", allIds);
        if (!cancelled) {
          setLikedSet(
            new Set((likeRows ?? []).map((r) => r.outfit_id as string)),
          );
        }
      }

      setProfileLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, reloadKey]);

  const filteredOutfits = useMemo(
    () => outfits.filter((o) => matchesGenderFilter(o.gender, gender)),
    [outfits, gender],
  );
  const filteredSaved = useMemo(
    () => savedOutfits.filter((o) => matchesGenderFilter(o.gender, gender)),
    [savedOutfits, gender],
  );

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading || !isLoggedIn) {
    return (
      <>
        <Header />
        <main id="main" tabIndex={-1} className="flex-1" />
      </>
    );
  }

  if (!profile) {
    // Should be unreachable because the effect always sets a fallback,
    // but render a placeholder rather than blanking the whole page.
    return (
      <>
        <Header />
        <main id="main" tabIndex={-1} className="flex-1" />
      </>
    );
  }

  const savedSet = new Set(savedOutfits.map((o) => o.id));

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        <div className="relative h-44 md:h-64 overflow-hidden bg-background-secondary">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-black/40 to-background" />
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Inställningar"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <Container className="-mt-12 md:-mt-16 relative z-10">
          <div className="flex items-end gap-5">
            <div className="ring-4 ring-background rounded-full">
              <UserAvatar
                src={profile.avatar}
                alt={profile.displayName}
                size="lg"
              />
            </div>
            <div className="flex-1 pb-3 min-w-0">
              <h1 className="font-heading text-3xl md:text-5xl uppercase tracking-tight text-white truncate">
                {profile.displayName}
              </h1>
              <p className="text-sm text-foreground-muted truncate">
                @{profile.username}
              </p>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 text-sm md:text-base text-foreground-muted max-w-2xl">
              {profile.bio}
            </p>
          )}

          <SocialLinks user={profile} className="mt-5" />

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-full border border-border text-white px-5 py-2 text-sm font-medium hover:border-white/30 transition-colors"
            >
              Redigera profil
            </button>
            <ShareButton
              url={`/profile/${profile.username}`}
              title={`${profile.displayName} på Moidello`}
              text={`Kolla in min profil på Moidello`}
              label="Dela profil"
            />
            <a
              href="/profil/statistik"
              className="rounded-full border border-border text-white px-5 py-2 text-sm font-medium hover:border-white/30 transition-colors"
            >
              Statistik
            </a>
            <a
              href="/profil/boards"
              className="rounded-full border border-border text-white px-5 py-2 text-sm font-medium hover:border-white/30 transition-colors"
            >
              Samlingar
            </a>
            {profile.accountType === "brand" && (
              <a
                href="/brand-dashboard"
                className="rounded-full bg-white text-black px-5 py-2 text-sm font-medium hover:bg-white/90 transition-colors"
              >
                Brand-dashboard
              </a>
            )}
          </div>

          <div className="mt-6 flex gap-8 border-y border-border py-4">
            <Stat label="Outfits" value={profile.outfitCount} />
            <Stat label="Följare" value={profile.followers} />
            <Stat label="Följer" value={profile.following} />
          </div>

          <div className="mt-2 flex border-b border-border">
            <ProfileTabButton
              active={tab === "outfits"}
              onClick={() => setTab("outfits")}
            >
              Outfits
            </ProfileTabButton>
            <ProfileTabButton
              active={tab === "saved"}
              onClick={() => setTab("saved")}
            >
              Sparade
            </ProfileTabButton>
            <ProfileTabButton
              active={tab === "about"}
              onClick={() => setTab("about")}
            >
              Om
            </ProfileTabButton>
          </div>

          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {tab === "outfits" &&
                  (profileLoading ? (
                    <Empty text="Laddar outfits…" />
                  ) : filteredOutfits.length > 0 ? (
                    <OutfitGrid
                      outfits={filteredOutfits}
                      columns={3}
                      liked={likedSet}
                      saved={savedSet}
                    />
                  ) : (
                    <Empty text="Inga outfits ännu — tryck Skapa för att lägga upp din första." />
                  ))}

                {tab === "saved" &&
                  (profileLoading ? (
                    <Empty text="Laddar sparade…" />
                  ) : filteredSaved.length > 0 ? (
                    <OutfitGrid
                      outfits={filteredSaved}
                      columns={3}
                      liked={likedSet}
                      saved={savedSet}
                    />
                  ) : (
                    <Empty text="Du har inte sparat något än." />
                  ))}

                {tab === "about" && (
                  <div className="max-w-2xl space-y-5 text-sm">
                    <Field label="Namn" value={profile.displayName} />
                    <Field
                      label="Användarnamn"
                      value={`@${profile.username}`}
                    />
                    {profile.bio && <Field label="Bio" value={profile.bio} />}
                    <Field
                      label="Antal outfits"
                      value={profile.outfitCount.toLocaleString("sv-SE")}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="py-16" />
        </Container>

        <ProfileEditSheet
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => setReloadKey((k) => k + 1)}
          profile={profile}
        />

        <AnimatePresence>
          {settingsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md"
              onClick={() => setSettingsOpen(false)}
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-background-secondary border border-white/10 p-6 relative"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading text-2xl uppercase tracking-tight text-white">
                    Inställningar
                  </h2>
                  <button
                    onClick={() => setSettingsOpen(false)}
                    aria-label="Stäng"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <ul className="divide-y divide-border">
                  <SettingsRow icon={Bell} label="Notiser" />
                  <SettingsRow icon={Lock} label="Konto & sekretess" />
                  <SettingsRow icon={HelpCircle} label="Hjälp" />
                  <SettingsRow icon={Info} label="Om Moidello" />
                  <SettingsRow
                    icon={LogOut}
                    label="Logga ut"
                    danger
                    onClick={handleSignOut}
                  />
                </ul>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

function ProfileTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex-1 sm:flex-none px-4 py-3 text-sm font-medium transition-colors",
        active
          ? "text-white"
          : "text-foreground-subtle hover:text-foreground-muted",
      )}
    >
      {children}
      {active && (
        <motion.span
          layoutId="profile-tab-indicator"
          className="absolute inset-x-3 -bottom-px h-0.5 bg-white rounded-full"
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      )}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-lg font-semibold text-white">
        {value.toLocaleString("sv-SE")}
      </p>
      <p className="text-xs text-foreground-subtle uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-24 text-center">
      <p className="text-foreground-muted">{text}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-foreground-subtle">
        {label}
      </p>
      <p className="mt-1 text-white">{value}</p>
    </div>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  danger,
  onClick,
}: {
  icon: typeof Settings;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 py-4 text-left transition-colors",
          danger
            ? "text-red-400 hover:text-red-300"
            : "text-white hover:text-white/80",
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="text-sm">{label}</span>
      </button>
    </li>
  );
}

