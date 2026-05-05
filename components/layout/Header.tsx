"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GenderToggle } from "@/components/ui/GenderToggle";
import { shouldShowAppHeader } from "@/lib/nav";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const HEADER_TRANSPARENT_ROUTES = new Set(["/", "/welcome", "/trendigt", "/profil"]);

function isTransparentRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return HEADER_TRANSPARENT_ROUTES.has(pathname);
}

export function Header() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const showHeader = shouldShowAppHeader(pathname);
  const allowTransparent = isTransparentRoute(pathname);

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

  const opaque = scrolled || !allowTransparent;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-300",
        opaque
          ? "bg-black/80 backdrop-blur-xl border-b border-white/5 light:bg-white/80 light:border-black/5"
          : "bg-transparent"
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="relative flex items-center justify-between gap-3 px-4 md:px-8 py-3 md:py-4 md:pl-24">
        {/* Left: Logo (desktop) + Gender toggle */}
        <div className="flex items-center gap-3 md:gap-5 min-w-0">
          <Link
            href="/"
            className={cn(
              "hidden md:block font-heading text-3xl uppercase tracking-tight",
              opaque ? "text-white light:text-black" : "text-white"
            )}
          >
            Moidello
          </Link>
          <GenderToggle orientation="horizontal" size="sm" />
        </div>

        {/* Center: Logo (mobile) — absolutely centered */}
        <Link
          href="/"
          className={cn(
            "md:hidden absolute left-1/2 -translate-x-1/2 font-heading text-2xl uppercase tracking-wider",
            opaque ? "text-white light:text-black" : "text-white"
          )}
        >
          Moidello
        </Link>

        {/* Center on desktop: persistent search */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div
            className={cn(
              "flex items-center w-full rounded-full px-4 py-2 transition-colors",
              "bg-white/5 border border-white/10",
              "light:bg-black/5 light:border-black/10"
            )}
          >
            <Search
              className={cn(
                "h-4 w-4 shrink-0",
                opaque ? "text-white/60 light:text-black/60" : "text-white/70"
              )}
            />
            <input
              type="search"
              placeholder="Sök outfits, märken, kreatörer…"
              className="flex-1 bg-transparent border-0 outline-none px-3 text-sm text-white placeholder:text-white/40 light:text-black light:placeholder:text-black/40"
            />
          </div>
        </div>

        {/* Right: Search icon (mobile) + login */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Sök"
            className={cn(
              "md:hidden inline-flex items-center justify-center h-11 w-11 rounded-full transition-colors",
              opaque
                ? "text-white/90 hover:bg-white/10 light:text-black/80 light:hover:bg-black/5"
                : "text-white hover:bg-white/10"
            )}
          >
            <Search className="h-5 w-5" />
          </button>

          {!isLoggedIn && (
            <Link
              href="/login"
              className={cn(
                "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold transition-transform active:scale-95",
                "bg-white text-black hover:bg-white/90",
                "light:bg-black light:text-white light:hover:bg-black/90"
              )}
            >
              Logga in
            </Link>
          )}
        </div>

        {/* Mobile expanded search overlay */}
        <AnimatePresence initial={false}>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute inset-0 flex items-center bg-black/95 backdrop-blur-xl px-4 light:bg-white/95"
            >
              <Search className="h-5 w-5 text-white/70 light:text-black/70 shrink-0" />
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Sök outfits, märken, kreatörer…"
                className="flex-1 bg-transparent border-0 outline-none px-3 text-base text-white placeholder:text-white/40 light:text-black light:placeholder:text-black/40"
              />
              <button
                onClick={() => setSearchOpen(false)}
                aria-label="Stäng sök"
                className="inline-flex items-center justify-center h-11 w-11 rounded-full text-white/90 hover:bg-white/10 light:text-black/90 light:hover:bg-black/5"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
