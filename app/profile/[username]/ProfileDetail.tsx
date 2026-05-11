"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
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
import { JsonLd } from "@/components/seo/JsonLd";
import { profilePageJsonLd } from "@/lib/json-ld";
import { useAuth } from "@/lib/auth-context";
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
  outfits,
  likedIds = [],
  savedIds = [],
  initiallyFollowing = false,
  publicBoards = [],
}: {
  user: MoidelloUser;
  outfits: Outfit[];
  likedIds?: string[];
  savedIds?: string[];
  initiallyFollowing?: boolean;
  publicBoards?: PublicBoardSummary[];
}) {
  const { user: viewer, isLoggedIn, requireAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "outfits" | "boards" | "followers" | "following" | "about"
  >("outfits");
  const [following, setFollowing] = useState(initiallyFollowing);
  useEffect(() => {
    setFollowing(initiallyFollowing);
  }, [user.id, initiallyFollowing]);
  const [, startTransition] = useTransition();
  const liked = useMemo(() => new Set(likedIds), [likedIds]);
  const saved = useMemo(() => new Set(savedIds), [savedIds]);

  const isOwnProfile = viewer?.id === user.id;

  const handleFollow = () => {
    if (!isLoggedIn) {
      requireAuth("follow");
      return;
    }
    if (isOwnProfile) return;
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const res = await toggleFollow(user.id);
      if (!res.ok) setFollowing(!next);
    });
  };

  const tabs: Array<{
    key: "outfits" | "boards" | "followers" | "following" | "about";
    label: string;
    count?: number;
  }> = [
    { key: "outfits", label: "Outfits", count: outfits.length },
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
            <h1 className="mt-4 font-heading text-[28px] md:text-[40px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
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
                className="text-center rounded-md px-1 -mx-1 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <p className="text-lg font-semibold text-white">
                  {formatNumber(user.followers)}
                </p>
                <p className="text-xs text-foreground-subtle">Följare</p>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("following")}
                className="text-center rounded-md px-1 -mx-1 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <p className="text-lg font-semibold text-white">
                  {formatNumber(user.following)}
                </p>
                <p className="text-xs text-foreground-subtle">Följer</p>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("outfits")}
                className="text-center rounded-md px-1 -mx-1 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <p className="text-lg font-semibold text-white">
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
                        ? "border border-border text-white hover:border-white/30"
                        : "bg-white text-black hover:bg-white/90"
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
                    ? "text-white"
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
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
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
              (outfits.length > 0 ? (
                <OutfitGrid outfits={outfits} columns={3} liked={liked} saved={saved} />
              ) : (
                <p className="py-16 text-center text-foreground-muted">
                  Inga outfits ännu.
                </p>
              ))}
            {activeTab === "boards" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {publicBoards.map((b) => (
                  <Link
                    key={b.id}
                    href={`/board/${b.id}`}
                    className="group rounded-2xl border border-border bg-background-secondary overflow-hidden hover:border-white/20 transition-colors"
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
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-wider text-white">
                        <Globe className="h-3 w-3" /> Publik
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="font-medium text-white truncate">{b.name}</p>
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
