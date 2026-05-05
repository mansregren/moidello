"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { FloatingBottomNav } from "./FloatingBottomNav";
import { shouldShowAppNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showNav = shouldShowAppNav(pathname);

  return (
    <>
      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col",
          showNav && "pb-28 md:pb-0"
        )}
      >
        {children}
      </div>
      {showNav && <FloatingBottomNav />}
    </>
  );
}
