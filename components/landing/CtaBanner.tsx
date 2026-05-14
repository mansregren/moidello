"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "../layout/Container";
import { PremiumButton } from "../shared/PremiumButton";
import { ArrowRight } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/bg/cafe.webp"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-xl"
        >
          <h2 className="font-heading text-[36px] md:text-[56px] lg:text-[72px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
            Dela din
            <br />
            <span className="text-white/60">stil med världen</span>
          </h2>
          <p className="mt-4 text-white/70 text-lg max-w-md">
            Skapa ditt konto och börja posta outfits idag.
            Tagga plaggen, inspirera andra.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <PremiumButton variant="primary" size="lg">
                Kom igång gratis
                <ArrowRight className="h-5 w-5" />
              </PremiumButton>
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
