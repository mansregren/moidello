"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight, MapPin, Flame } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { UserAvatar } from "@/components/user/UserAvatar";
import { useGender, matchesGenderFilter } from "@/lib/gender-context";
import type { Outfit, User } from "@/lib/types";

interface TrendingBrand {
  id: string;
  slug: string;
  name: string;
  newOutfits: number;
}

const TRENDING_STYLES = [
  { name: "Quiet Luxury", count: 412, image: "/images/bg/positano.webp" },
  { name: "Y2K", count: 287, image: "/images/bg/boats.webp" },
  { name: "Old Money", count: 356, image: "/images/bg/harbor.webp" },
  { name: "Coastal Grandma", count: 198, image: "/images/bg/positano.webp" },
];

export default function TrendigtClient({
  outfits,
  creators,
  brands,
  likedIds = [],
  savedIds = [],
}: {
  outfits: Outfit[];
  creators: User[];
  brands: TrendingBrand[];
  likedIds?: string[];
  savedIds?: string[];
}) {
  const { gender } = useGender();
  const liked = useMemo(() => new Set(likedIds), [likedIds]);
  const saved = useMemo(() => new Set(savedIds), [savedIds]);

  const genderOutfits = outfits.filter((o) =>
    matchesGenderFilter(o.gender, gender),
  );

  const trendingNow = [...genderOutfits]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 4);

  const localOutfits = [...genderOutfits].slice(0, 4);

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        <Container className="pt-6 md:pt-10 space-y-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground flex items-center gap-3">
              Trendigt
              <Flame className="h-8 w-8 md:h-12 md:w-12 text-foreground" />
            </h1>
            <p className="mt-3 text-foreground-muted">
              Vad alla pratar om just nu
            </p>
          </motion.div>

          {trendingNow.length > 0 && (
            <Section title="Trending just nu" href="/upptack">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {trendingNow.map((outfit, i) => (
                  <motion.div
                    key={outfit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                  >
                    <OutfitCard
                      outfit={outfit}
                      initiallyLiked={liked.has(outfit.id)}
                      initiallySaved={saved.has(outfit.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </Section>
          )}

          {creators.length > 0 && (
            <Section title="Top creators denna vecka" href="/upptack">
              <div className="-mx-6 md:-mx-12 px-6 md:px-12 flex gap-5 overflow-x-auto pb-3 scrollbar-hide">
                {creators.map((user, i) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="shrink-0"
                  >
                    <Link
                      href={`/profile/${user.username}`}
                      aria-label={`${user.displayName} — ${user.followers.toLocaleString("sv-SE")} följare`}
                      className="flex flex-col items-center gap-3 w-32 group"
                    >
                      <div className="relative">
                        <UserAvatar src={user.avatar} alt="" size="lg" />
                        <span
                          aria-hidden="true"
                          className="absolute -top-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold"
                        >
                          {i + 1}
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground truncate max-w-[8rem]">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-foreground-subtle">
                          {user.followers.toLocaleString("sv-SE")} följare
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </Section>
          )}

          {brands.length > 0 && (
            <Section title="Heta märken" href="/brands">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {brands.map((b, i) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <Link
                      href={`/brand/${b.slug}`}
                      className="block rounded-2xl border border-border bg-background-secondary p-5 text-center transition-colors hover:border-foreground/30 hover:bg-background-tertiary"
                    >
                      <p className="font-medium text-foreground text-sm truncate">
                        {b.name}
                      </p>
                      <p className="mt-1 text-[11px] text-foreground-subtle">
                        {b.newOutfits}{" "}
                        {b.newOutfits === 1 ? "outfit" : "outfits"}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </Section>
          )}

          <Section title="Trending stilar" href="/upptack">
            <div className="-mx-6 md:-mx-12 px-6 md:px-12 flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
              {TRENDING_STYLES.map((s, i) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="shrink-0"
                >
                  <Link
                    href="/upptack"
                    className="relative block w-56 h-72 rounded-2xl overflow-hidden group"
                  >
                    <Image
                      src={s.image}
                      alt={s.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute inset-x-4 bottom-4">
                      <p className="font-heading text-2xl uppercase tracking-tight text-foreground">
                        {s.name}
                      </p>
                      <p className="text-xs text-foreground/70">
                        {s.count} outfits
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </Section>

          {localOutfits.length > 0 && (
            <Section
              title="Populärt i Stockholm"
              href="/upptack"
              icon={<MapPin className="h-6 w-6 text-foreground" />}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {localOutfits.map((outfit, i) => (
                  <motion.div
                    key={outfit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                  >
                    <OutfitCard
                      outfit={outfit}
                      initiallyLiked={liked.has(outfit.id)}
                      initiallySaved={saved.has(outfit.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </Section>
          )}

          <div className="py-16" />
        </Container>
      </main>
    </>
  );
}

function Section({
  title,
  href,
  icon,
  children,
}: {
  title: string;
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-3 font-heading text-[28px] md:text-[40px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
          {icon}
          {title}
        </h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors shrink-0"
        >
          Se alla
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      {children}
    </section>
  );
}
