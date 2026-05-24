"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Globe } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { UserAvatar } from "@/components/user/UserAvatar";
import { SocialLinks } from "@/components/user/SocialLinks";
import { MessageButton } from "@/components/user/MessageButton";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { FollowersList } from "@/components/user/FollowersList";
import { ShareButton } from "@/components/shared/ShareButton";
import { ReportButton } from "@/components/shared/ReportButton";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { OutfitOwnerActions } from "@/components/outfit/OutfitOwnerActions";
import { JsonLd } from "@/components/seo/JsonLd";
import { profilePageJsonLd } from "@/lib/json-ld";
import { useAuth } from "@/lib/auth-context";
import { useViewerEngagement } from "@/lib/viewer-engagement-context";
// gender-context används inte längre här — profilen visar alla outfits
// oavsett besökarens filter.
import { motion } from "framer-motion";
import type { Outfit, User as MoidelloUser } from "@/lib/types";
import { toggleFollow } from "@/app/actions/engagement";

export interface PublicBoardSummary {
  id: string;
  name: string;
  description: string | null;
  outfitCount: number;
  coverImage: string | null;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function ProfileDetail({
  user,
  outfits: allOutfits,
  publicBoards = [],
  showHome = false,
}: {
  user: MoidelloUser;
  outfits: Outfit[];
  publicBoards?: PublicBoardSummary[];
  showHome?: boolean;
}) {
  const { user: viewer, isLoggedIn, requireAuth } = useAuth();
  const engagement = useViewerEngagement();
  const [activeTab, setActiveTab] = useState<
    "outfits" | "hem" | "boards" | "followers" | "following" | "about"
  >("outfits");
  // Follow state is hydrated client-side via the engagement context so this
  // page can be ISR cached.
  const following = engagement.isFollowing(user.id);
  const [, startTransition] = useTransition();

  const isOwnProfile = viewer?.id === user.id;
  // En kreatörs profil visar ALLA deras publikationer oavsett besökarens
  // gender-toggle. Filtret hör hemma i feeds (/upptack, /, /foljer) där
  // användaren bläddrar — på en specifik profil vill man se vad just den
  // personen publicerat. Tidigare logik filtrerade bort herr-kreatörers
  // outfits för besökare med dam-filter, vilket gjorde profiler tomma.
  //
  // Mode och hem separeras i flikar. Medan hem-vertikalen är dold
  // (showHome=false) exkluderas hem-poster helt så de inte läcker.
  const outfits = useMemo(
    () => allOutfits.filter((o) => o.vertical !== "hem"),
    [allOutfits],
  );
  const homeOutfits = useMemo(
    () => (showHome ? allOutfits.filter((o) => o.vertical === "hem") : []),
    [allOutfits, showHome],
  );

  const renderGrid = (list: Outfit[], emptyText: string) => {
    if (list.length === 0) {
      return (
        <p className="py-16 text-center text-foreground-muted">{emptyText}</p>
      );
    }
    if (isOwnProfile) {
      return (
        <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-3">
          {list.map((outfit) => (
            <div key={outfit.id} className="space-y-2">
              <OutfitCard outfit={outfit} />
              <OutfitOwnerActions
                outfitId={outfit.id}
                isHidden={!!outfit.isHidden}
                isAdmin={false}
                editHref={`/profil/inlagg/${outfit.id}`}
              />
            </div>
          ))}
        </div>
      );
    }
    return <OutfitGrid outfits={list} columns={3} />;
  };

  const handleFollow = () => {
    if (!isLoggedIn) {
      requireAuth("follow");
      return;
    }
    if (isOwnProfile) return;
    const next = !following;
    engagement.markFollowing(user.id, next);
    startTransition(async () => {
      const res = await toggleFollow(user.id);
      if (!res.ok) engagement.markFollowing(user.id, !next);
    });
  };

  const tabs: Array<{
    key: "outfits" | "hem" | "boards" | "followers" | "following" | "about";
    label: string;
    count?: number;
  }> = [
    { key: "outfits", label: "Outfits", count: outfits.length },
    ...(homeOutfits.length > 0
      ? [{ key: "hem" as const, label: "Hem", count: homeOutfits.length }]
      : []),
    ...(publicBoards.length > 0
      ? [{ key: "boards" as const, label: "Samlingar", count: publicBoards.length }]
      : []),
    { key: "followers", label: "Följare", count: user.followers },
    { key: "following", label: "Följer", count: user.following },
    { key: "about", label: "Om" },
  ];

  return (
    <>
      <Header />
      <JsonLd data={profilePageJsonLd(user, outfits)} />
      <main id="main" tabIndex={-1} className="flex-1 pt-16 md:pt-20">
        {user.coverImage && (
          <div className="relative h-48 md:h-72 overflow-hidden">
            <Image
              src={user.coverImage}
              alt=""
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        )}

        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`flex flex-col items-center text-center ${
              user.coverImage ? "-mt-16" : "mt-8"
            } mb-8`}
          >
            <UserAvatar
              src={user.avatar}
              alt={user.displayName}
              size="xl"
              className="border-4 border-background"
            />
            <h1 className="mt-4 font-heading text-[28px] md:text-[40px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
              {user.displayName}
            </h1>
            <p className="text-sm text-foreground-subtle mt-1">
              @{user.username}
            </p>
            {user.bio && (
              <p className="text-foreground-muted mt-3 max-w-md">{user.bio}</p>
            )}

            <div className="flex items-center gap-8 mt-6">
              <button
                type="button"
                onClick={() => setActiveTab("followers")}
                className="text-center rounded-md px-1 -mx-1 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
              >
                <p className="text-lg font-semibold text-foreground">
                  {formatNumber(user.followers)}
                </p>
                <p className="text-xs text-foreground-subtle">Följare</p>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("following")}
                className="text-center rounded-md px-1 -mx-1 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
              >
                <p className="text-lg font-semibold text-foreground">
                  {formatNumber(user.following)}
                </p>
                <p className="text-xs text-foreground-subtle">Följer</p>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("outfits")}
                className="text-center rounded-md px-1 -mx-1 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
              >
                <p className="text-lg font-semibold text-foreground">
                  {user.outfitCount}
                </p>
                <p className="text-xs text-foreground-subtle">Outfits</p>
              </button>
            </div>

            <SocialLinks user={user} className="mt-5" />

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {!isOwnProfile && (
                <>
                  <button
                    type="button"
                    onClick={handleFollow}
                    className={`rounded-full px-6 py-2 text-sm font-semibold transition-colors ${
                      following
                        ? "border border-border text-foreground hover:border-foreground/30"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    }`}
                  >
                    {following ? "Följer" : "Följ"}
                  </button>
                  <MessageButton userId={user.id} />
                </>
              )}
              <ShareButton
                url={`/profile/${user.username}`}
                title={`${user.displayName} på Moidello`}
                text={
                  user.bio
                    ? `${user.displayName} — ${user.bio}`
                    : `Kolla in ${user.displayName} på Moidello`
                }
              />
              {!isOwnProfile && (
                <ReportButton targetType="profile" targetId={user.id} />
              )}
            </div>
          </motion.div>

          <div className="flex justify-center border-b border-border mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? "text-foreground"
                    : "text-foreground-subtle hover:text-foreground-muted"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1.5 text-foreground-subtle">
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="profileTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                  />
                )}
              </button>
            ))}
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="pb-16"
          >
            {activeTab === "outfits" &&
              renderGrid(outfits, "Inga outfits ännu.")}
            {activeTab === "hem" && renderGrid(homeOutfits, "Inga rum ännu.")}
            {activeTab === "boards" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {publicBoards.map((b) => (
                  <Link
                    key={b.id}
                    href={`/board/${b.id}`}
                    className="group rounded-2xl border border-border bg-background-secondary overflow-hidden hover:border-foreground/20 transition-colors"
                  >
                    <div className="relative aspect-[4/3] bg-background-tertiary">
                      {b.coverImage ? (
                        <Image
                          src={b.coverImage}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          unoptimized={b.coverImage.startsWith("http")}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-foreground-subtle text-sm">
                          Tom samling
                        </div>
                      )}
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-background/70 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-wider text-foreground">
                        <Globe className="h-3 w-3" /> Publik
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="font-medium text-foreground truncate">{b.name}</p>
                      <p className="text-xs text-foreground-subtle mt-0.5">
                        {b.outfitCount} {b.outfitCount === 1 ? "outfit" : "outfits"}
                      </p>
                      {b.description && (
                        <p className="text-sm text-foreground-muted mt-2 line-clamp-2">
                          {b.description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {activeTab === "followers" && (
              <FollowersList profileId={user.id} mode="followers" />
            )}
            {activeTab === "following" && (
              <FollowersList profileId={user.id} mode="following" />
            )}
            {activeTab === "about" && (
              <div className="max-w-md mx-auto text-center">
                {user.bio ? (
                  <p className="text-foreground-muted">{user.bio}</p>
                ) : (
                  <p className="text-foreground-subtle text-sm">
                    Den här användaren har ingen biografi än.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </Container>
      </main>
    </>
  );
}
