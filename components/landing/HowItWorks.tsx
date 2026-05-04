"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Camera, Tag, ShoppingBag } from "lucide-react";
import { Container } from "../layout/Container";

const steps = [
  {
    icon: Camera,
    title: "Ladda upp",
    description: "Ta en bild på din outfit och ladda upp den till Moidello.",
  },
  {
    icon: Tag,
    title: "Tagga plaggen",
    description: "Markera varje plagg i bilden med märke, namn och köplänk.",
  },
  {
    icon: ShoppingBag,
    title: "Dela & shoppa",
    description: "Andra kan upptäcka din stil och köpa plaggen direkt.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/bg/ocean.jpg"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <Container className="relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="font-heading text-[36px] md:text-[56px] leading-[0.95] uppercase tracking-[-0.02em] text-white text-center mb-16"
        >
          Hur det <span className="text-white/50">fungerar</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
                <step.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-heading text-xl uppercase tracking-tight text-white mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-white/60 max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
