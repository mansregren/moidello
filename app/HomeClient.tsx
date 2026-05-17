"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles, Search, Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { UserAvatar } from "@/components/user/UserAvatar";
import { categories } from "@/lib/data";
import { useGender, matchesGenderFilter } from "@/lib/gender-context";
import type { Outfit, User } from "@/lib/types";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Streetwear: "Edge möter komfort",
  Minimalism: "Mindre är mer",
  Vintage: "Tidlöst & unikt",
  Casual: "Avslappnat & lätt",
  Formal: "Tailored & polerat",
  Sporty: "Aktiv vardag",
  Preppy: "Klassisk & ren",
};

// Static cover per category — used when no real outfits exist for that
// category yet. Avoids leaking placeholder outfit imagery in production.
const CATEGORY_COVER: Record<string, string> = {
  Streetwear: "/images/bg/harbor.webp",
  Minimalism: "/images/bg/parasols.webp",
  Vintage: "/images/bg/positano.webp",
  Casual: "/images/bg/riviera.webp",
  Formal: "/images/bg/boats.webp",
  Sporty: "/images/bg/parasols.webp",
  Preppy: "/images/bg/harbor.webp",
};

type CategoryCover = { category: string; gender: "herr" | "dam"; image: string };

export default function HomeClient({
  outfits,
  following = [],
  creators,
  categoryCovers = [],
  topColors = [],
  likedIds = [],
  savedIds = [],
  heroBg = "/images/bg/positano.webp",
  lifestyleBg = "/images/bg/parasols.webp",
}: {
  outfits: Outfit[];
  following?: Outfit[];
  creators: User[];
  categoryCovers?: CategoryCover[];
  /** Top color slugs (lowercase) for the browse-rad below kategorier. */
  topColors?: string[];
  likedIds?: string[];
  savedIds?: string[];
  heroBg?: string;
  lifestyleBg?: string;
}) {
  const { gender } = useGender();
  const liked = useMemo(() => new Set(likedIds), [likedIds]);
  const saved = useMemo(() => new Set(savedIds), [savedIds]);

  const visible = outfits.filter((o) => matchesGenderFilter(o.gender, gender));
  const recent = [...visible]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);

  const followingVisible = useMemo(
    () =>
      following
        .filter((o) => matchesGenderFilter(o.gender, gender))
        .slice(0, 6),
    [following, gender],
  );

  // Real outfit image for a category card — strictly same-gender as the
  // current filter. If the category has no outfit for this gender, fall
  // back to the static background (never show the other gender's outfit).
  const categoryImage = (cat: string): string => {
    const match = categoryCovers.find(
      (c) => c.category === cat && c.gender === gender,
    );
    if (match) return match.image;
    return CATEGORY_COVER[cat] ?? "/images/bg/positano.webp";
  };

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        <section className="relative">
          <div className="relative h-[44vh] md:h-[60vh] min-h-[320px] overflow-hidden">
            <Image
              src={heroBg}
              alt=""
              fill
              className="object-cover"
              priority
            />
            {/* Dark scrim — heaviest at the bottom where the text sits, so
                the white hero copy stays legible over any photo in both
                themes. Intentionally NOT theme-tokenised (text-over-photo,
                same rationale as image-scrim gradients elsewhere). */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/30 to-black/70" />
            <Container className="relative z-10 h-full flex flex-col justify-end pb-8 md:pb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-white/80">
                  Inspiration för din stil
                </p>
                <h1 className="mt-3 font-heading text-[44px] md:text-[88px] leading-[0.92] uppercase tracking-[-0.02em] text-white max-w-3xl">
                  Hitta din nästa
                  <br />
                  <span className="text-white/60">favorit</span>
                </h1>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/upptack"
                    className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium transition-transform active:scale-95"
                  >
                    <Search className="h-4 w-4" />
                    Utforska
                  </Link>
                  <Link
                    href="/trendigt"
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 text-white px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
                  >
                    <Sparkles className="h-4 w-4" />
                    Trendigt nu
                  </Link>
                </div>
              </motion.div>
            </Container>
          </div>
        </section>

        <Container className="space-y-14 pt-10 md:pt-14">
          {followingVisible.length > 0 && (
            <Section
              title="Från dina följda"
              href="/foljer"
              seeAllLabel="Hela flödet"
            >
              <OutfitGrid
                outfits={followingVisible}
                columns={3}
                liked={liked}
                saved={saved}
              />
            </Section>
          )}

          <Section
            title="Bläddra kategorier"
            href="/upptack"
            seeAllLabel="Alla kategorier"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                >
                  <Link
                    href={`/stil/${cat.toLowerCase()}`}
                    aria-label={`${cat} — ${CATEGORY_DESCRIPTIONS[cat]}`}
                    className="group relative block aspect-[4/5] rounded-2xl overflow-hidden"
                  >
                    <Image
                      src={categoryImage(cat)}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized={categoryImage(cat).startsWith("http")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute inset-x-3 bottom-3">
                      <p className="font-heading text-lg md:text-xl uppercase tracking-tight text-white leading-tight">
                        {cat}
                      </p>
                      <p className="text-[11px] text-white/70 mt-0.5">
                        {CATEGORY_DESCRIPTIONS[cat]}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </Section>

          {topColors.length > 0 && (
            <Section title="Bläddra på färg" href="/upptack">
              <ul className="flex flex-wrap gap-2">
                {topColors.slice(0, 12).map((c) => (
                  <li key={c}>
                    <Link
                      href={`/farg/${c}`}
                      className="inline-block rounded-full border border-border bg-background-secondary px-4 py-2 text-sm text-foreground-muted hover:text-foreground hover:border-foreground/30 transition-colors capitalize"
                    >
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Senast på Moidello" href="/upptack">
            {recent.length > 0 ? (
              <OutfitGrid
                outfits={recent}
                columns={3}
                liked={liked}
                saved={saved}
              />
            ) : (
              <div className="rounded-2xl border border-border bg-background-secondary p-10 text-center">
                <p className="text-foreground-muted">
                  Inga outfits ännu — bli först att lägga upp en.
                </p>
                <Link
                  href="/skapa"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Skapa outfit
                </Link>
              </div>
            )}
          </Section>

          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="relative -mx-6 md:-mx-12 h-[40vh] md:h-[50vh] overflow-hidden"
          >
            <Image
              src={lifestyleBg}
              alt=""
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div className="text-center max-w-3xl">
                <p className="font-heading text-[36px] md:text-[64px] lg:text-[80px] uppercase tracking-[-0.02em] text-white leading-[0.95]">
                  Dress for the
                  <br />
                  <span className="text-white/60">life you want</span>
                </p>
                <p className="mt-4 text-sm md:text-base text-white/70 max-w-md mx-auto">
                  Tagga varje plagg, länka var du köper. Inspirera och
                  inspireras.
                </p>
              </div>
            </div>
          </motion.section>

          {creators.length > 0 && (
            <Section title="Nya kreatörer" href="/trendigt">
              <div className="-mx-6 md:-mx-12 px-6 md:px-12 flex gap-5 overflow-x-auto pb-3 scrollbar-hide">
                {creators.map((u, i) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="shrink-0"
                  >
                    <Link
                      href={`/profile/${u.username}`}
                      aria-label={`${u.displayName} — ${u.outfitCount} outfits`}
                      className="flex flex-col items-center gap-3 w-28 group"
                    >
                      <UserAvatar src={u.avatar} alt="" size="lg" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground truncate max-w-[7rem]">
                          {u.displayName}
                        </p>
                        <p className="text-[11px] text-foreground-subtle">
                          {u.outfitCount} outfits
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </Section>
          )}

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-border bg-background-secondary p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="max-w-lg">
              <h2 className="font-heading text-3xl md:text-5xl uppercase tracking-tight text-foreground leading-[0.95]">
                Bygg ditt eget bibliotek
              </h2>
              <p className="mt-3 text-foreground-muted text-sm md:text-base">
                Spara outfits, följ kreatörer och skapa dina egna. Det är
                gratis.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link
                href="/skapa"
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium transition-transform active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Skapa outfit
              </Link>
              <Link
                href="/om"
                className="inline-flex items-center rounded-full border border-border text-foreground px-5 py-2.5 text-sm font-medium hover:border-foreground/30 transition-colors"
              >
                Lär dig mer
              </Link>
            </div>
          </motion.section>

          <div className="py-12" />
        </Container>
      </main>
    </>
  );
}

function Section({
  title,
  href,
  seeAllLabel = "Se alla",
  children,
}: {
  title: string;
  href: string;
  seeAllLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-end justify-between mb-5">
        <h2 className="font-heading text-[28px] md:text-[40px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
          {title}
        </h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors shrink-0"
        >
          {seeAllLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      {children}
    </section>
  );
}
