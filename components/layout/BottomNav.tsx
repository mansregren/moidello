"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MouseEvent } from "react";
import { motion } from "framer-motion";
import { primaryNav } from "@/lib/nav";
import { useAuth, AuthAction } from "@/lib/auth-context";
import { haptic } from "@/lib/toast-context";
import { cn } from "@/lib/utils";

const PILL_LAYOUT_ID = "bottom-nav-active-pill";
const SPRING = { type: "spring" as const, stiffness: 350, damping: 30 };

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, requireAuth } = useAuth();

  const handleClick = (
    e: MouseEvent<HTMLAnchorElement>,
    authAction?: "create" | "profile"
  ) => {
    haptic(10);
    if (!authAction || isLoggedIn) return;
    e.preventDefault();
    if (authAction === "profile") {
      router.push("/login");
      return;
    }
    requireAuth(authAction as AuthAction);
  };

  return (
    <nav
      aria-label="Huvudnavigation"
      className="fixed inset-x-3 bottom-0 z-40 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      <ul
        className={cn(
          "relative flex items-end justify-between gap-1 rounded-3xl px-2 py-2.5",
          "bg-black/60 backdrop-blur-2xl backdrop-saturate-150",
          "border border-white/10 shadow-2xl shadow-black/50",
          "light:bg-white/70 light:border-black/10 light:shadow-black/10"
        )}
      >
        {primaryNav.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          if (item.primary) {
            return (
              <li key={item.href} className="flex-1 flex justify-center">
                <motion.div whileTap={{ scale: 0.92 }} className="-translate-y-2">
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    onClick={(e) => handleClick(e, item.authAction)}
                    className={cn(
                      "relative flex h-14 w-14 items-center justify-center rounded-full",
                      "bg-gradient-to-br from-white to-zinc-100 text-black",
                      "border-2 border-white/20",
                      "shadow-[0_8px_24px_rgba(255,255,255,0.18),inset_0_-1px_2px_rgba(0,0,0,0.08)]",
                      "transition-transform duration-300"
                    )}
                  >
                    <motion.span
                      animate={{ rotate: active ? 45 : 0 }}
                      transition={SPRING}
                      className="flex items-center justify-center"
                    >
                      <Icon className="h-6 w-6" strokeWidth={2.5} />
                    </motion.span>
                  </Link>
                </motion.div>
              </li>
            );
          }

          return (
            <li key={item.href} className="flex-1">
              <motion.div whileTap={{ scale: 0.95 }}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => handleClick(e, item.authAction)}
                  className="relative flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-2xl"
                >
                  {active && (
                    <motion.span
                      layoutId={PILL_LAYOUT_ID}
                      transition={SPRING}
                      className={cn(
                        "absolute inset-0 rounded-2xl bg-white",
                        "light:bg-black"
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex flex-col items-center gap-0.5 transition-colors",
                      active
                        ? "text-black light:text-white"
                        : "text-white/50 light:text-black/50"
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                    {active && (
                      <span className="text-[10px] font-medium tracking-wide">
                        {item.label}
                      </span>
                    )}
                  </span>
                </Link>
              </motion.div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
