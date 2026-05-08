"use client";

import Image from "next/image";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { UserAvatar } from "@/components/user/UserAvatar";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import type { Outfit, User as MoidelloUser } from "@/lib/types";
import { toggleFollow } from "@/app/actions/engagement";

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
}: {
  user: MoidelloUser;
  outfits: Outfit[];
  likedIds?: string[];
  savedIds?: string[];
  initiallyFollowing?: boolean;
}) {
  const { user: viewer, isLoggedIn, requireAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<"outfits" | "about">("outfits");
  const [following, setFollowing] = useOptimistic(
    initiallyFollowing,
    (_state, next: boolean) => next,
  );
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
    startTransition(async () => {
      setFollowing(!following);
      const res = await toggleFollow(user.id);
      if (!res.ok) setFollowing(following);
    });
  };

  const tabs = [
    { key: "outfits" as const, label: "Outfits", count: outfits.length },
    { key: "about" as const, label: "Om" },
  ];

  return (
    <>
      <Header />
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
              <div className="text-center">
                <p className="text-lg font-semibold text-white">
                  {formatNumber(user.followers)}
                </p>
                <p className="text-xs text-foreground-subtle">Följare</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white">
                  {formatNumber(user.following)}
                </p>
                <p className="text-xs text-foreground-subtle">Följer</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white">
                  {user.outfitCount}
                </p>
                <p className="text-xs text-foreground-subtle">Outfits</p>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="mt-6">
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
              </div>
            )}
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
