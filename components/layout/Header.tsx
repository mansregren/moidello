"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState, MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "./Container";
import { IconButton } from "../shared/IconButton";
import { GenderToggle } from "../shared/GenderToggle";
import { primaryNav, shouldShowAppHeader } from "@/lib/nav";
import { useAuth, AuthAction } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, requireAuth } = useAuth();
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

  const handleNavClick = (
    e: MouseEvent<HTMLAnchorElement>,
    authAction?: "create" | "profile"
  ) => {
    if (!authAction || isLoggedIn) return;
    e.preventDefault();
    if (authAction === "profile") {
      router.push("/login");
      return;
    }
    requireAuth(authAction as AuthAction);
  };

  if (!showHeader) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-300",
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Container className="relative flex items-center h-14 md:h-20 gap-4">
        {/* Mobile: gender toggle (left) */}
        <div className="md:hidden flex items-center min-w-0">
          <GenderToggle orientation="horizontal" />
        </div>

        {/* Desktop: logo (left) */}
        <Link
          href="/"
          className="hidden md:block font-heading text-3xl uppercase tracking-tight text-white shrink-0"
        >
          Moidello
        </Link>

        {/* Mobile: logo (center, absolute) */}
        <Link
          href="/"
          className="md:hidden absolute left-1/2 -translate-x-1/2 font-heading text-2xl uppercase tracking-tight text-white"
        >
          Moidello
        </Link>

        {/* Desktop: nav links */}
        <nav
          aria-label="Huvudnavigation"
          className="hidden md:flex items-center gap-1 ml-4"
        >
          {primaryNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={(e) => handleNavClick(e, item.authAction)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  active
                    ? "text-white bg-white/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="hidden md:flex flex-1" />

        {/* Right: gender toggle (desktop), search, login */}
        <div className="ml-auto md:ml-0 flex items-center gap-2">
          <div className="hidden md:block">
            <GenderToggle orientation="horizontal" />
          </div>
          <IconButton aria-label="Sök" onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
          </IconButton>
          {!isLoggedIn && (
            <Link
              href="/login"
              className="inline-flex items-center rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-transform active:scale-95 hover:bg-white/90"
            >
              Logga in
            </Link>
          )}
        </div>

        {/* Search expansion */}
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
