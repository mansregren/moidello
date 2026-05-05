"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState, MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "./Container";
import { IconButton } from "../shared/IconButton";
import { GenderToggle } from "../shared/GenderToggle";
import { primaryNav } from "@/lib/nav";
import { shouldShowAppHeader } from "@/lib/nav";
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
        "sticky top-0 right-0 z-40 transition-colors duration-300",
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      )}
    >
      {/* Row 1 — Gender toggle / Logo / Search + Login */}
      <Container className="relative flex items-center justify-between h-14 md:h-20 gap-3">
        <div className="flex items-center min-w-0">
          <GenderToggle orientation="horizontal" />
        </div>

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-heading text-2xl md:text-3xl uppercase tracking-tight text-white"
        >
          Moidello
        </Link>

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

        {/* Expanded mobile search overlay (covers row 1 only) */}
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

      {/* Row 2 — Nav (mobile only; desktop uses the sidebar) */}
      <Container className="md:hidden">
        <nav aria-label="Huvudnavigation" className="border-t border-white/5">
          <ul className="flex items-center justify-around py-1.5">
            {primaryNav.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;

              if (item.primary) {
                return (
                  <li key={item.href} className="flex-1 flex justify-center">
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      aria-current={active ? "page" : undefined}
                      onClick={(e) => handleNavClick(e, item.authAction)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-[0_4px_14px_rgba(255,255,255,0.18)] transition-transform active:scale-95"
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.4} />
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.href} className="flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={(e) => handleNavClick(e, item.authAction)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-1 transition-colors",
                      active ? "text-white" : "text-white/40 hover:text-white/70"
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                    <span className="text-[10px] font-medium tracking-wide">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </Container>
    </header>
  );
}
