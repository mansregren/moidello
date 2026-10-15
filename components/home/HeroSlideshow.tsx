"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SLIDE_INTERVAL_MS = 10000;

export function HeroSlideshow({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  // Slides stay mounted once shown, so a crossfade back to them never
  // waits on the network. Only the current and the next slide are mounted
  // up front: the next one loads in the background through next/image (the
  // same optimised, viewport-sized file it will display), instead of
  // pre-fetching every full-size original on first paint.
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0, 1]));

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % images.length;
        setMounted((m) => {
          const after = (next + 1) % images.length;
          if (m.has(next) && m.has(after)) return m;
          return new Set([...m, next, after]);
        });
        return next;
      });
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {images.map((src, i) =>
        mounted.has(i) ? (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover transition-opacity duration-[1400ms] ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : null,
      )}
    </div>
  );
}
