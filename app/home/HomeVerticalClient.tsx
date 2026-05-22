"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import {
  HOME_ROOMS,
  HOME_CATEGORY_DESCRIPTIONS,
} from "@/lib/home-data";
import type { Outfit } from "@/lib/types";

type CategoryCover = { category: string; image: string };

export default function HomeVerticalClient({
  posts,
  categoryCovers = [],
  likedIds = [],
  savedIds = [],
  heroBg = "/images/bg/riviera.webp",
}: {
  posts: Outfit[];
  categoryCovers?: CategoryCover[];
  likedIds?: string[];
  savedIds?: string[];
  heroBg?: string;
}) {
  const liked = useMemo(() => new Set(likedIds), [likedIds]);
  const saved = useMemo(() => new Set(savedIds), [savedIds]);

  // Real cover for a room card — newest home post in that room. Returns
  // null when the room has no post yet, so we render a clean typographic
  // placeholder instead of a misleading travel photo (premium voice).
  const coverFor = (label: string): string | null =>
    categoryCovers.find((c) => c.category === label)?.image ?? null;

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        <section className="relative">
          <div className="relative h-[40vh] md:h-[54vh] min-h-[300px] overflow-hidden">
            <Image src={heroBg} alt="" fill className="object-cover" priority />
            {/* Text-over-photo scrim — intentionally not theme-tokenised,
                same rationale as the fashion hero. */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/30 to-black/70" />
            <Container className="relative z-10 h-full flex flex-col justify-end pb-8 md:pb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-white/80">
                  Heminredning
                </p>
                <h1 className="mt-3 font-heading text-[40px] md:text-[80px] leading-[0.92] uppercase tracking-[-0.02em] text-white max-w-3xl">
                  Inred för
                  <br />
                  <span className="text-white/60">livet hemma</span>
                </h1>
                <p className="mt-4 max-w-md text-sm md:text-base text-white/75">
                  Rum att inspireras av. Tagga varje möbel och hitta var du
                  köper den.
                </p>
              </motion.div>
            </Container>
          </div>
        </section>

        <Container className="space-y-14 pt-10 md:pt-14">
          <section>
            <h2 className="font-heading text-[28px] md:text-[40px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground mb-5">
              Bläddra rum
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {HOME_ROOMS.map((room, i) => {
                const cover = coverFor(room.label);
                return (
                  <motion.div
                    key={room.slug}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.35, delay: i * 0.03 }}
                  >
                    <Link
                      href={`/home/${room.slug}`}
                      aria-label={`${room.label} — ${HOME_CATEGORY_DESCRIPTIONS[room.label] ?? ""}`}
                      className="group relative block aspect-[4/5] rounded-2xl overflow-hidden border border-border"
                    >
                      {cover ? (
                        <>
                          <Image
                            src={cover}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 18vw, (min-width: 640px) 33vw, 50vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized={cover.startsWith("http")}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                          <div className="absolute inset-x-3 bottom-3">
                            <p className="font-heading text-base md:text-lg uppercase tracking-tight text-white leading-tight">
                              {room.label}
                            </p>
                            <p className="text-[11px] text-white/70 mt-0.5">
                              {HOME_CATEGORY_DESCRIPTIONS[room.label]}
                            </p>
                          </div>
                        </>
                      ) : (
                        // No post for this room yet → clean typographic card
                        // on the brand cream, not a misleading travel photo.
                        <div
                          className="absolute inset-0 flex flex-col justify-end p-3 transition-transform group-hover:scale-[1.02]"
                          style={{ backgroundColor: "#F7F6F3" }}
                        >
                          <p className="font-heading text-base md:text-lg uppercase tracking-tight text-neutral-900 leading-tight">
                            {room.label}
                          </p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            {HOME_CATEGORY_DESCRIPTIONS[room.label]}
                          </p>
                        </div>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="font-heading text-[28px] md:text-[40px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground mb-5">
              Senast inrett
            </h2>
            {posts.length > 0 ? (
              <OutfitGrid
                outfits={posts}
                columns={3}
                liked={liked}
                saved={saved}
              />
            ) : (
              <div className="rounded-2xl border border-border bg-background-secondary p-10 text-center">
                <p className="text-foreground-muted">
                  Inga rum ännu — bli först att inreda.
                </p>
                <Link
                  href="/skapa?vertical=hem"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Lägg upp ett rum
                </Link>
              </div>
            )}
          </section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-border bg-background-secondary p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="max-w-lg">
              <h2 className="font-heading text-3xl md:text-5xl uppercase tracking-tight text-foreground leading-[0.95]">
                Visa upp ditt hem
              </h2>
              <p className="mt-3 text-foreground-muted text-sm md:text-base">
                Dela ett rum, tagga möblerna och länka var man köper dem. Det
                är gratis.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                href="/skapa?vertical=hem"
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium transition-transform active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Lägg upp ett rum
              </Link>
            </div>
          </motion.section>

          <div className="py-12" />
        </Container>
      </main>
    </>
  );
}
