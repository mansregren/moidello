"use client";

import { motion } from "framer-motion";
import { Container } from "../layout/Container";
import { OutfitCard } from "../outfit/OutfitCard";
import { outfits } from "@/lib/data";
import { useGender } from "@/lib/gender-context";
import Link from "next/link";
import { PremiumButton } from "../shared/PremiumButton";
import { ArrowRight } from "lucide-react";

export function FeaturedOutfits() {
  const { gender } = useGender();
  const featured = outfits.filter((o) => o.gender === gender).slice(0, 6);

  return (
    <section className="py-16 md:py-24 bg-background-secondary">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <h2 className="font-heading text-[36px] md:text-[56px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
              Utvalda
              <br />
              <span className="text-foreground-subtle">Outfits</span>
            </h2>
          </div>
          <Link href="/" className="hidden md:block">
            <PremiumButton variant="secondary" size="sm">
              Visa alla
              <ArrowRight className="h-4 w-4" />
            </PremiumButton>
          </Link>
        </motion.div>

        {/* Grid — 3 columns masonry-style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((outfit, i) => (
            <motion.div
              key={outfit.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={i % 3 === 1 ? "sm:mt-12" : ""}
            >
              <OutfitCard outfit={outfit} />
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <Link href="/">
            <PremiumButton variant="secondary">
              Visa alla outfits
              <ArrowRight className="h-4 w-4" />
            </PremiumButton>
          </Link>
        </div>
      </Container>
    </section>
  );
}
