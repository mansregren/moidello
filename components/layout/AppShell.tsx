"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { Footer } from "./Footer";
import { shouldShowFooter } from "@/lib/nav";

export function AppShell({
  children,
  footerBg,
}: {
  children: ReactNode;
  footerBg?: string;
}) {
  const pathname = usePathname();
  const showFooter = shouldShowFooter(pathname);

  return (
    // reducedMotion="user" — framer-motion now respects
    // prefers-reduced-motion globally. CSS-level @media-rule in
    // globals.css already shorted CSS transitions; this catches the
    // JS-driven motion.* components too.
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-1 flex-col">
        {children}
        {showFooter && <Footer bg={footerBg} />}
      </div>
    </MotionConfig>
  );
}
