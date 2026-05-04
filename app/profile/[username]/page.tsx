"use client";

import { use, useState } from "react";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { UserAvatar } from "@/components/user/UserAvatar";
import { FollowButton } from "@/components/user/FollowButton";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { users, outfits } from "@/lib/data";
import { motion } from "framer-motion";

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const user = users.find((u) => u.username === username) ?? users[0];
  const userOutfits = outfits.filter((o) => o.creator.id === user.id);
  const [activeTab, setActiveTab] = useState<"outfits" | "saved" | "about">("outfits");

  const tabs = [
    { key: "outfits" as const, label: "Outfits", count: user.outfitCount },
    { key: "saved" as const, label: "Sparade", count: 24 },
    { key: "about" as const, label: "Om" },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 pt-16 md:pt-20">
        {/* Cover image */}
        {user.coverImage && (
          <div className="relative h-48 md:h-72 overflow-hidden">
            <Image
              src={user.coverImage}
              alt="Cover"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        )}

        <Container>
          {/* Profile info */}
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
            <p className="text-foreground-muted mt-3 max-w-md">{user.bio}</p>

            {/* Stats */}
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

            <div className="mt-6">
              <FollowButton />
            </div>
          </motion.div>

          {/* Tabs */}
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

          {/* Tab content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="pb-16"
          >
            {activeTab === "outfits" && (
              <OutfitGrid outfits={userOutfits} columns={3} />
            )}
            {activeTab === "saved" && (
              <OutfitGrid outfits={outfits.slice(3, 7)} columns={3} />
            )}
            {activeTab === "about" && (
              <div className="max-w-md mx-auto text-center">
                <p className="text-foreground-muted">{user.bio}</p>
                <div className="mt-8 space-y-3 text-sm text-foreground-subtle">
                  <p>Medlem sedan oktober 2025</p>
                  <p>Stockholm, Sverige</p>
                </div>
              </div>
            )}
          </motion.div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
