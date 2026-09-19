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
import { MobileMenu } from "./MobileMenu";
import { visiblePrimaryNav, shouldShowAppHeader } from "@/lib/nav";
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
  const { isLoggedIn, requireAuth, profile } = useAuth();
  const showHeader = shouldShowAppHeader(pathname);
  const navItems = visiblePrimaryNav(!!profile?.isAdmin);

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

  // Mobile search is a full-screen takeover (like MobileMenu), so lock
  // background scroll while it's open — otherwise the feed behind it stays
  // scrollable and the overlay reads as a stray floating bar instead of a
  // proper modal.
  useEffect(() => {
    if (!searchOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
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
        {/* Mobile: search (left column) */}
        <div className="md:hidden flex items-center justify-self-start">
          <IconButton aria-label="Search" onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
          </IconButton>
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
          className="md:hidden justify-self-center font-heading text-2xl uppercase tracking-tight text-foreground whitespace-nowrap"
        >
          Moidello
        </Link>

        {/* Desktop: nav links */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-1 ml-4"
        >
          {navItems.map((item) => {
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
          <IconButton
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="hidden md:inline-flex"
          >
            <Search className="h-5 w-5" />
          </IconButton>
          {isLoggedIn ? (
            <>
              <NotificationBell />
              <div className="hidden md:block">
                <UserMenu />
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden md:inline-flex items-center rounded-full bg-foreground text-background px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-transform active:scale-95 hover:bg-foreground/90"
            >
              Log in
            </Link>
          )}
          <MobileMenu />
        </div>

        {/* Search expansion — full-screen takeover on mobile (matches
            MobileMenu) so it never sits as a floating bar over a scrolled
            feed; on desktop it stays an inline replacement of the header row. */}
        <AnimatePresence initial={false}>
          {searchOpen && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 md:absolute md:inset-0 z-50 md:z-10 flex flex-col bg-background md:bg-background/95 md:backdrop-blur-xl"
              style={{ paddingTop: "env(safe-area-inset-top)" }}
              onSubmit={(e) => {
                e.preventDefault();
                const q = searchInputRef.current?.value.trim();
                if (q) {
                  router.push(`/sok?q=${encodeURIComponent(q)}`);
                  setSearchOpen(false);
                }
              }}
            >
              <div className="flex items-center h-14 md:h-20 px-4 md:px-6 gap-2 shrink-0">
                <Search className="h-5 w-5 text-foreground-muted shrink-0" />
                <input
                  ref={searchInputRef}
                  type="search"
                  name="q"
                  placeholder="Search outfits, brands, creators…"
                  className="flex-1 bg-transparent border-0 outline-none px-3 text-base text-foreground placeholder:text-foreground-subtle"
                />
                <IconButton aria-label="Close search" onClick={() => setSearchOpen(false)}>
                  <X className="h-5 w-5" />
                </IconButton>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Container>
    </header>
  );
}
