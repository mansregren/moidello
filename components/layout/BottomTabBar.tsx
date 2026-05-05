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

export function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, requireAuth } = useAuth();

  const handleClick = (
    e: MouseEvent<HTMLAnchorElement>,
    href: string,
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
      aria-label="Huvudnavigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="border-t border-white/5 bg-black light:bg-white light:border-black/10">
        <ul className="flex items-end justify-around px-2 pt-2 pb-2">
          {primaryNav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            if (item.primary) {
              return (
                <li
                  key={item.href}
                  className="flex items-center justify-center -mt-6"
                >
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    onClick={(e) => handleClick(e, item.href, item.authAction)}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-[0_8px_24px_rgba(255,255,255,0.18)] light:bg-black light:text-white light:shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-transform duration-300 active:scale-95"
                  >
                    <Icon className="h-7 w-7" strokeWidth={2.4} />
                  </Link>
                </li>
              );
            }

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => handleClick(e, item.href, item.authAction)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-1.5 transition-colors duration-300",
                    active
                      ? "text-white light:text-black"
                      : "text-white/40 light:text-black/40 hover:text-white/70 light:hover:text-black/70"
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
      </div>
    </nav>
  );
}
