"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { FloatingBottomNav } from "./FloatingBottomNav";
import { Footer } from "./Footer";
import { shouldShowAppNav, shouldShowFooter } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showNav = shouldShowAppNav(pathname);
  const showFooter = shouldShowFooter(pathname);

  return (
    <>
      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col",
          showNav && "pb-28 md:pb-0"
        )}
      >
        {children}
        {showFooter && <Footer />}
      </div>
      {showNav && <FloatingBottomNav />}
    </>
  );
}
