"use client";

import { Search } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { UserCard } from "@/components/user/UserCard";
import { outfits, users, categories } from "@/lib/data";
import { useGender } from "@/lib/gender-context";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function DiscoverPage() {
  const { gender } = useGender();
  const genderOutfits = outfits.filter((o) => o.gender === gender);
  const trendingOutfits = [...genderOutfits].sort((a, b) => b.likes - a.likes).slice(0, 4);
  const topCreators = [...users].sort((a, b) => b.followers - a.followers).slice(0, 4);

  const trendingBrands = [
    { name: "Acne Studios", count: 234 },
    { name: "COS", count: 189 },
    { name: "Nike", count: 567 },
    { name: "Totême", count: 145 },
    { name: "Our Legacy", count: 123 },
    { name: "Arket", count: 198 },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 pt-20 md:pt-24">
        <Container>
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-white mb-6">
              Upptäck
            </h1>
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-subtle" />
              <input
                type="text"
                placeholder="Sök outfits, kreatörer, märken..."
                className="w-full rounded-full bg-background-tertiary border border-border pl-12 pr-6 py-4 text-white placeholder:text-foreground-subtle outline-none focus:border-white/30 transition-colors"
                disabled
              />
            </div>
          </motion.div>

          {/* Trending outfits */}
          <section className="mb-16">
            <h2 className="font-heading text-[28px] md:text-[40px] leading-[0.95] uppercase tracking-[-0.02em] text-white mb-8">
              Trending <span className="text-foreground-subtle">just nu</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingOutfits.map((outfit, i) => (
                <motion.div
                  key={outfit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <OutfitCard outfit={outfit} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Categories */}
          <section className="mb-16">
            <h2 className="font-heading text-[28px] md:text-[40px] leading-[0.95] uppercase tracking-[-0.02em] text-white mb-8">
              Kategorier
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link href={`/feed?category=${cat}`}>
                    <div className="relative shrink-0 w-40 h-52 rounded-2xl overflow-hidden group cursor-pointer">
                      <Image
                        src={outfits[i % outfits.length].image}
                        alt={cat}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <p className="absolute bottom-4 left-4 font-heading text-lg uppercase text-white">
                        {cat}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Top creators */}
          <section className="mb-16">
            <h2 className="font-heading text-[28px] md:text-[40px] leading-[0.95] uppercase tracking-[-0.02em] text-white mb-8">
              Top <span className="text-foreground-subtle">Kreatörer</span>
            </h2>
            <div className="flex flex-wrap gap-12">
              {topCreators.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <UserCard user={user} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Trending brands */}
          <section className="mb-16">
            <h2 className="font-heading text-[28px] md:text-[40px] leading-[0.95] uppercase tracking-[-0.02em] text-white mb-8">
              Trending <span className="text-foreground-subtle">Märken</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {trendingBrands.map((brand, i) => (
                <motion.div
                  key={brand.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="rounded-2xl border border-border bg-background-secondary p-6 text-center hover:border-white/20 transition-colors cursor-pointer"
                >
                  <p className="font-medium text-white text-sm">{brand.name}</p>
                  <p className="text-xs text-foreground-subtle mt-1">
                    {brand.count} outfits
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
