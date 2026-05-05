"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MouseEvent } from "react";
import { primaryNav } from "@/lib/nav";
import { useAuth, AuthAction } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SideFloatingNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, requireAuth } = useAuth();

  const handleClick = (
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

  return (
    <nav
      aria-label="Variant C — flytande sida"
      className="fixed right-2 top-1/2 -translate-y-1/2 z-40 md:hidden"
    >
      <div className="rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 px-1.5 py-2">
        <div className="text-[8px] uppercase tracking-wider text-white/30 text-center mb-1.5">
          C
        </div>
        <ul className="flex flex-col items-center gap-1.5">
          {primaryNav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            if (item.primary) {
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    onClick={(e) => handleClick(e, item.authAction)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-[0_4px_14px_rgba(255,255,255,0.18)] transition-transform active:scale-95"
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.4} />
                  </Link>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => handleClick(e, item.authAction)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                    active
                      ? "text-white bg-white/10"
                      : "text-white/40 hover:text-white/70"
                  )}
                  title={item.label}
                >
                  <Icon className="h-4 w-4" strokeWidth={active ? 2.4 : 1.8} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
