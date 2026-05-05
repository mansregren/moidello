"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, Menu, X, Settings, LogOut, HelpCircle, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "./Container";
import { IconButton } from "../shared/IconButton";
import { useGender } from "@/lib/gender-context";
import { Gender } from "@/lib/types";
import { shouldShowAppNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Hem" },
  { href: "/feed", label: "Feed" },
  { href: "/brands", label: "Märken" },
  { href: "/discover", label: "Upptäck" },
  { href: "/create", label: "Skapa" },
];

const menuLinks = [
  { href: "/settings", label: "Inställningar", icon: Settings },
  { href: "/help", label: "Hjälp", icon: HelpCircle },
  { href: "/about", label: "Om Moidello", icon: Info },
];

function GenderToggle() {
  const { gender, setGender } = useGender();

  return (
    <div className="flex items-center rounded-full border border-border bg-background-secondary p-0.5">
      {(["dam", "herr"] as Gender[]).map((g) => (
        <button
          key={g}
          onClick={() => setGender(g)}
          className={`relative px-4 py-1.5 text-xs font-medium uppercase tracking-wider rounded-full transition-all duration-300 ${
            gender === g
              ? "bg-white text-black"
              : "text-foreground-muted hover:text-white"
          }`}
        >
          {g === "dam" ? "Dam" : "Herr"}
        </button>
      ))}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const showAppNav = shouldShowAppNav(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      setHidden(y > 80 && y > lastY);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 z-50 transition-all duration-300",
          showAppNav ? "left-0 md:left-20" : "left-0",
          hidden && !mobileOpen ? "md:translate-y-0 -translate-y-full" : "translate-y-0",
          scrolled || mobileOpen
            ? "glass-strong border-b border-white/5"
            : "bg-transparent"
        )}
      >
        <Container className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-white shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            Moidello
          </Link>

          {/* Center — Gender toggle + Navigation (desktop only on landing) */}
          {!showAppNav && (
            <div className="hidden md:flex items-center gap-6">
              <GenderToggle />
              <div className="w-px h-5 bg-border" />
              <nav className="flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-foreground-muted hover:text-white transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {/* Expanded search bar */}
          <AnimatePresence initial={false}>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "100%" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute inset-x-0 top-0 h-16 md:h-20 flex items-center bg-background/95 backdrop-blur-xl px-4 md:px-8 z-10"
              >
                <Search className="h-5 w-5 text-foreground-muted shrink-0" />
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Sök outfits, märken, kreatörer…"
                  className="flex-1 bg-transparent border-0 outline-none px-3 text-base text-white placeholder:text-foreground-subtle"
                />
                <IconButton
                  aria-label="Stäng sök"
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-5 w-5" />
                </IconButton>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right side */}
          <div className="flex items-center gap-1">
            {!showAppNav && (
              <div className="md:hidden">
                <GenderToggle />
              </div>
            )}

            <IconButton
              aria-label="Sök"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </IconButton>

            <Link href="/login" className="hidden sm:block">
              <IconButton aria-label="Profil">
                <User className="h-5 w-5" />
              </IconButton>
            </Link>

            {/* Mobile hamburger */}
            <IconButton
              aria-label={mobileOpen ? "Stäng meny" : "Öppna meny"}
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </IconButton>
          </div>
        </Container>
      </header>

      {/* Mobile menu overlay — slim: settings, help, about, gender, log out */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-20 md:hidden"
          >
            <Container>
              <div className="mt-6 flex flex-col items-start">
                <span className="text-xs uppercase tracking-wider text-foreground-subtle mb-3">
                  Visa
                </span>
                <GenderToggle />
              </div>

              <nav className="mt-10 flex flex-col gap-1">
                {menuLinks.map((link, i) => {
                  const Icon = link.icon;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, delay: i * 0.06 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-4 py-4 text-2xl font-heading uppercase tracking-tight text-white hover:text-foreground-muted transition-colors"
                      >
                        <Icon className="h-6 w-6 text-foreground-muted" />
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                className="mt-10 pt-6 border-t border-border"
              >
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 text-foreground-muted hover:text-white transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm">Logga ut</span>
                </Link>
              </motion.div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
