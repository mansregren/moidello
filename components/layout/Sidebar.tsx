"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MouseEvent } from "react";
import { primaryNav } from "@/lib/nav";
import { GenderToggle } from "../shared/GenderToggle";
import { useAuth, AuthAction } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
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
    <aside
      aria-label="Sidonavigation"
      className="hidden md:flex fixed top-0 bottom-0 left-0 z-50 w-20 flex-col items-center border-r border-white/5 bg-black/85 backdrop-blur-xl py-4"
    >
      <Link
        href="/"
        className="font-heading text-lg uppercase tracking-tight text-white mb-3"
        aria-label="Moidello — startsida"
      >
        M
      </Link>

      <GenderToggle orientation="vertical" className="mb-5 w-14" />

      <ul className="flex flex-col items-center gap-1">
        {primaryNav.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          if (item.primary) {
            return (
              <li key={item.href} className="my-2">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => handleClick(e, item.authAction)}
                  className="group flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-[0_8px_24px_rgba(255,255,255,0.18)] transition-transform duration-300 hover:scale-105 active:scale-95"
                  title={item.label}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.4} />
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
                  "group relative flex flex-col items-center justify-center gap-0.5 h-14 w-14 rounded-2xl transition-colors duration-300",
                  active
                    ? "text-white bg-white/10"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
                title={item.label}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                <span className="text-[9px] font-medium tracking-wide">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
