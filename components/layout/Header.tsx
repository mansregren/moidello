"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "./Container";
import { IconButton } from "../shared/IconButton";
import { GenderToggle } from "../shared/GenderToggle";
import { shouldShowAppHeader } from "@/lib/nav";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const showHeader = shouldShowAppHeader(pathname);

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  if (!showHeader) return null;

  return (
    <header
      className={cn(
        "sticky top-0 right-0 z-40 transition-colors duration-300",
        scrolled
          ? "bg-black/70 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      )}
    >
      <Container className="relative flex items-center justify-between h-16 md:h-20 gap-3">
        {/* Left — Gender toggle */}
        <div className="flex items-center min-w-0">
          <GenderToggle orientation="horizontal" />
        </div>

        {/* Center — Logo */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-heading text-2xl md:text-3xl uppercase tracking-tight text-white"
        >
          Moidello
        </Link>

        {/* Right — Search + login */}
        <div className="flex items-center gap-1">
          <IconButton aria-label="Sök" onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
          </IconButton>
          {!isLoggedIn && (
            <Link
              href="/login"
              className="ml-1 inline-flex items-center rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-transform active:scale-95 hover:bg-white/90"
            >
              Logga in
            </Link>
          )}
        </div>

        {/* Expanded search */}
        <AnimatePresence initial={false}>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-0 flex items-center bg-black/95 backdrop-blur-xl px-4 md:px-6 z-10"
            >
              <Search className="h-5 w-5 text-foreground-muted shrink-0" />
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Sök outfits, märken, kreatörer…"
                className="flex-1 bg-transparent border-0 outline-none px-3 text-base text-white placeholder:text-foreground-subtle"
              />
              <IconButton aria-label="Stäng sök" onClick={() => setSearchOpen(false)}>
                <X className="h-5 w-5" />
              </IconButton>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </header>
  );
}
