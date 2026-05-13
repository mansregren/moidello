"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function LifestyleBanner() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="relative h-[40vh] md:h-[50vh] overflow-hidden"
    >
      <Image
        src="/images/bg/parasols.webp"
        alt="Mediterranean lifestyle"
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-heading text-[36px] md:text-[64px] lg:text-[80px] uppercase tracking-[-0.02em] text-white text-center leading-[0.95]">
          Dress for the
          <br />
          <span className="text-white/60">life you want</span>
        </p>
      </div>
    </motion.section>
  );
}
