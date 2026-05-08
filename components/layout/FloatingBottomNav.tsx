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

export function FloatingBottomNav() {
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
      aria-label="Huvudnavigation"
      className="fixed inset-x-3 bottom-0 z-40 md:hidden pointer-events-none"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      <div className="pointer-events-auto rounded-3xl bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 px-2 py-2">
        <ul className="flex items-center justify-around">
          {primaryNav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            if (item.primary) {
              return (
                <li key={item.href} className="flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={(e) => handleClick(e, item.authAction)}
                    className="flex flex-col items-center gap-0.5 py-1 transition-transform active:scale-95"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-[0_4px_14px_rgba(255,255,255,0.18)]">
                      <Icon
                        className="h-5 w-5"
                        strokeWidth={2.4}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="text-[10px] font-medium tracking-wide text-white">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            }

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => handleClick(e, item.authAction)}
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
      </div>
    </nav>
  );
}
