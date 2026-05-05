"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/feed") return pathname === "/feed" || pathname.startsWith("/feed/");
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Huvudnavigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="border-t border-white/5 bg-black/70 backdrop-blur-xl backdrop-saturate-150">
        <ul className="flex items-stretch justify-around px-2 pt-2 pb-2">
          {primaryNav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            if (item.primary) {
              return (
                <li key={item.href} className="flex items-center justify-center -mt-5">
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-[0_8px_24px_rgba(255,255,255,0.18)]",
                      "transition-transform duration-300 active:scale-95"
                    )}
                  >
                    <Icon className="h-6 w-6" strokeWidth={2.4} />
                  </Link>
                </li>
              );
            }

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-1.5 transition-colors duration-300",
                    active ? "text-white" : "text-foreground-subtle hover:text-foreground-muted"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                  <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
