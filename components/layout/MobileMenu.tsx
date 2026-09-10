"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, Bookmark, MessageCircle } from "lucide-react";
import { IconButton } from "../shared/IconButton";
import { primaryNav } from "@/lib/nav";
import { useAuth, AuthAction } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, requireAuth, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const isHomeArea = pathname?.startsWith("/home") ?? false;

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock scroll + close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleNavClick = (
    e: MouseEvent<HTMLAnchorElement>,
    authAction?: "create" | "profile"
  ) => {
    if (!authAction || isLoggedIn) {
      setOpen(false);
      return;
    }
    e.preventDefault();
    setOpen(false);
    if (authAction === "profile") {
      router.push("/login");
      return;
    }
    requireAuth(authAction as AuthAction);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    router.push("/");
  };

  return (
    <div className="md:hidden">
      <IconButton
        aria-label="Meny"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </IconButton>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.nav
              aria-label="Huvudnavigation"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className="fixed inset-y-0 right-0 z-50 flex w-[78%] max-w-xs flex-col bg-background-secondary border-l border-border shadow-2xl shadow-black/50"
              style={{
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-border">
                <span className="font-heading text-lg uppercase tracking-tight text-foreground">
                  Moidello
                </span>
                <IconButton aria-label="Stäng meny" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </IconButton>
              </div>

              <ul className="flex-1 overflow-y-auto py-2">
                {primaryNav.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  const href =
                    item.authAction === "create" && isHomeArea
                      ? "/skapa?vertical=hem"
                      : item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        onClick={(e) => handleNavClick(e, item.authAction)}
                        className={cn(
                          "flex items-center gap-3 px-5 py-3.5 text-base transition-colors",
                          active
                            ? "text-foreground font-semibold bg-foreground/10"
                            : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                        )}
                      >
                        <Icon
                          className="h-5 w-5 shrink-0"
                          strokeWidth={active ? 2.4 : 1.8}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}

                {isLoggedIn && (
                  <>
                    <li className="my-2 border-t border-border" />
                    <li>
                      <Link
                        href="/meddelanden"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-5 py-3.5 text-base text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
                      >
                        <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                        Meddelanden
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/profil"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-5 py-3.5 text-base text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
                      >
                        <Bookmark className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                        Sparade
                      </Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-5 py-3.5 text-base text-red-400 hover:bg-foreground/5 transition-colors"
                      >
                        <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                        Logga ut
                      </button>
                    </li>
                  </>
                )}
              </ul>

              {!isLoggedIn && (
                <div className="border-t border-border p-4">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center rounded-full bg-foreground text-background px-4 py-2.5 text-sm font-semibold uppercase tracking-wider transition-transform active:scale-95"
                  >
                    Logga in
                  </Link>
                </div>
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
