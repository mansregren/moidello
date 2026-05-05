"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Sidonavigation"
      className="hidden md:flex fixed top-0 bottom-0 left-0 z-50 w-20 flex-col items-center border-r border-white/5 bg-black/85 backdrop-blur-xl pt-24 pb-6"
    >
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
                  className={cn(
                    "group flex h-12 w-12 items-center justify-center rounded-full bg-white text-black",
                    "shadow-[0_8px_24px_rgba(255,255,255,0.18)] transition-transform duration-300 hover:scale-105 active:scale-95"
                  )}
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
                className={cn(
                  "group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300",
                  active ? "text-white bg-white/10" : "text-foreground-subtle hover:text-white hover:bg-white/5"
                )}
                title={item.label}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-background-tertiary border border-border px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
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
