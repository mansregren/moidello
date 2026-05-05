"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "../layout/Container";
import { PremiumButton } from "../shared/PremiumButton";
import { ArrowRight } from "lucide-react";
import { useGender } from "@/lib/gender-context";

const heroImagesHerr = [
  "/images/outfit-beige-suit.png",
  "/images/outfit-striped-shirt.jpg",
  "/images/outfit-resort.jpg",
  "/images/outfit-linen.webp",
];

const heroImagesDam = [
  "/images/w-venice-cardigan.jpg",
  "/images/w-striped-paris.jpg",
  "/images/w-beige-bomber.jpg",
  "/images/w-cafe-blouse.jpg",
];

export function HeroSection() {
  const { gender } = useGender();
  const heroImages = gender === "herr" ? heroImagesHerr : heroImagesDam;

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Mobile: Background image */}
      <div className="absolute inset-0 lg:hidden">
        <Image
          src={heroImages[0]}
          alt="Outfit inspiration"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black" />
      </div>

      {/* Desktop: Dark background */}
      <div className="absolute inset-0 hidden lg:block bg-gradient-to-b from-background via-background to-background-secondary" />

      <Container className="relative z-10 flex-1 flex items-center pt-24 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="font-heading text-[48px] md:text-[80px] lg:text-[100px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
              Inspiration
              <br />
              <span className="text-white/50">for every</span>
              <br />
              Outfit
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-md">
              Upptäck, dela och shoppa outfits från kreatörer du älskar.
              Tagga varje plagg, länka var du köper.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/">
                <PremiumButton variant="primary" size="lg">
                  Utforska outfits
                  <ArrowRight className="h-5 w-5" />
                </PremiumButton>
              </Link>
              <Link href="/signup">
                <PremiumButton variant="glass" size="lg">
                  Skapa konto
                </PremiumButton>
              </Link>
            </div>
          </motion.div>

          {/* Mobile: Scrollable image row */}
          <motion.div
            key={gender}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="lg:hidden flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide"
          >
            {heroImages.map((src, i) => (
              <div
                key={src}
                className="relative shrink-0 w-44 aspect-[3/4] overflow-hidden rounded-2xl"
              >
                <Image
                  src={src}
                  alt="Outfit inspiration"
                  fill
                  className="object-cover"
                  priority={i < 2}
                />
              </div>
            ))}
          </motion.div>

          {/* Desktop: Editorial images grid */}
          <motion.div
            key={`desktop-${gender}`}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            <div className="space-y-4 pt-12">
              <div className="relative overflow-hidden rounded-2xl aspect-[3/4]">
                <Image
                  src={heroImages[0]}
                  alt="Outfit inspiration"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl aspect-[3/4]">
                <Image
                  src={heroImages[1]}
                  alt="Outfit inspiration"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="relative overflow-hidden rounded-2xl aspect-[3/4]">
                <Image
                  src={heroImages[2]}
                  alt="Outfit inspiration"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
