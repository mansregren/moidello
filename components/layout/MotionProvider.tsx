"use client";

import { ReactNode } from "react";
import { LazyMotion, MotionConfig } from "framer-motion";

const loadFeatures = () => import("@/lib/motion-features").then((m) => m.default);

/**
 * App-wide framer-motion setup. Components use the lightweight `m.*`
 * elements; the animation engine itself is code-split and loaded after
 * the page is interactive instead of shipping in every page's main bundle.
 * reducedMotion="user" respects prefers-reduced-motion for JS animations.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
