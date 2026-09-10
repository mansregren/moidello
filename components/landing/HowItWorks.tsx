"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Camera, Tag, ShoppingBag } from "lucide-react";
import { Container } from "../layout/Container";

const steps = [
  {
    icon: Camera,
    title: "Upload",
    description: "Take a photo of your outfit and upload it to Moidello.",
  },
  {
    icon: Tag,
    title: "Tag the pieces",
    description: "Mark every piece in the image with its brand, name and a buy link.",
  },
  {
    icon: ShoppingBag,
    title: "Share & shop",
    description: "Others can discover your style and buy the pieces directly.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/bg/ocean.webp"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-background/85" />
      </div>

      <Container className="relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="font-heading text-[36px] md:text-[56px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground text-center mb-16"
        >
          Hur det <span className="text-foreground/50">fungerar</span>
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
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-foreground/20 bg-foreground/10 backdrop-blur-sm">
                <step.icon className="h-7 w-7 text-foreground" />
              </div>
              <h3 className="font-heading text-xl uppercase tracking-tight text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-foreground/60 max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
