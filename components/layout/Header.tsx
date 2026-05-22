"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState, MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "./Container";
import { IconButton } from "../shared/IconButton";
import { GenderToggle } from "../shared/GenderToggle";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
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
          ? "bg-background/80 backdrop-blur-xl border-b border-foreground/5"
          : "bg-transparent"
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Mobile: 3-col grid [toggle | logo | icons]. The center column is
          viewport-centered because the two 1fr side columns are equal, so
          the logo stays exactly centered without absolute positioning (no
          overlap with the 3-pill toggle). Desktop switches to flex. */}
      <Container className="relative grid grid-cols-[1fr_auto_1fr] items-center h-14 gap-2 md:flex md:h-20 md:gap-4">
        {/* Mobile: gender toggle (left column) */}
        <div className="md:hidden flex items-center justify-self-start">
          <GenderToggle orientation="horizontal" />
        </div>

        {/* Desktop: logo (left) */}
        <Link
          href="/"
          className="hidden md:block font-heading text-3xl uppercase tracking-tight text-foreground shrink-0"
        >
          Moidello
        </Link>

        {/* Mobile: logo (center column, truly viewport-centered) */}
        <Link
          href="/"
          className="md:hidden justify-self-center font-heading text-lg uppercase tracking-tight text-foreground whitespace-nowrap"
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
            const href =
              item.authAction === "create" && pathname?.startsWith("/home")
                ? "/skapa?vertical=hem"
                : item.href;
            return (
              <Link
                key={item.href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={(e) => handleNavClick(e, item.authAction)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  active
                    ? "text-foreground bg-foreground/10"
                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
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
        <div className="justify-self-end flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="hidden md:block">
            <GenderToggle orientation="horizontal" />
          </div>
          <IconButton aria-label="Sök" onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
          </IconButton>
          {isLoggedIn ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center rounded-full bg-foreground text-background px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-transform active:scale-95 hover:bg-foreground/90"
            >
              Logga in
            </Link>
          )}
        </div>

        {/* Search expansion */}
        <AnimatePresence initial={false}>
          {searchOpen && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-0 flex items-center bg-background/95 backdrop-blur-xl px-4 md:px-6 z-10"
              onSubmit={(e) => {
                e.preventDefault();
                const q = searchInputRef.current?.value.trim();
                if (q) {
                  router.push(`/sok?q=${encodeURIComponent(q)}`);
                  setSearchOpen(false);
                }
              }}
            >
              <Search className="h-5 w-5 text-foreground-muted shrink-0" />
              <input
                ref={searchInputRef}
                type="search"
                name="q"
                placeholder="Sök outfits, märken, kreatörer…"
                className="flex-1 bg-transparent border-0 outline-none px-3 text-base text-foreground placeholder:text-foreground-subtle"
              />
              <IconButton aria-label="Stäng sök" onClick={() => setSearchOpen(false)}>
                <X className="h-5 w-5" />
              </IconButton>
            </motion.form>
          )}
        </AnimatePresence>
      </Container>
    </header>
  );
}
