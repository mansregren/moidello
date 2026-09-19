"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

const SLIDE_INTERVAL_MS = 10000;
const FADE_DURATION_S = 1.4;

export function HeroSlideshow({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);

  // Warm the browser cache for every slide up front so later crossfades
  // never wait on a network fetch mid-transition (which reads as a pop,
  // not a fade).
  useEffect(() => {
    images.slice(1).forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [images]);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <AnimatePresence>
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_DURATION_S, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={images[index]}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
