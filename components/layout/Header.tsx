"use client";

import Link from "next/link";
import { Search, User, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "./Container";
import { IconButton } from "../shared/IconButton";
import { useGender } from "@/lib/gender-context";
import { Gender } from "@/lib/types";

const navLinks = [
  { href: "/", label: "Hem" },
  { href: "/feed", label: "Feed" },
  { href: "/brands", label: "Märken" },
  { href: "/discover", label: "Upptäck" },
  { href: "/create", label: "Skapa" },
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
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { gender, setGender } = useGender();

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

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          hidden && !mobileOpen ? "md:translate-y-0 -translate-y-full" : "translate-y-0"
        } ${
          scrolled || mobileOpen
            ? "glass-strong border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <Container className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-white"
            onClick={() => setMobileOpen(false)}
          >
            Moidello
          </Link>

          {/* Center — Gender toggle + Navigation (desktop) */}
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

          {/* Right side */}
          <div className="flex items-center gap-1">
            {/* Mobile gender toggle */}
            <div className="md:hidden">
              <GenderToggle />
            </div>

            <IconButton aria-label="Sök" className="hidden sm:flex">
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

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-20"
          >
            <Container>
              <nav className="flex flex-col gap-2 mt-4">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay: i * 0.07 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-4 font-heading text-[40px] uppercase leading-[0.95] tracking-[-0.02em] text-white hover:text-foreground-muted transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="mt-12 flex flex-col gap-4"
              >
                <div className="h-px bg-border" />
                <div className="flex items-center gap-4 pt-4">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-foreground-muted hover:text-white transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-sm">Logga in</span>
                  </Link>
                  <Link
                    href="/discover"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 text-foreground-muted hover:text-white transition-colors"
                  >
                    <Search className="h-5 w-5" />
                    <span className="text-sm">Sök</span>
                  </Link>
                </div>
              </motion.div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
