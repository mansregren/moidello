"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar } from "./DesktopSidebar";
import { BottomNav } from "./BottomNav";
import { shouldShowSidebar, shouldShowBottomTabBar } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showSidebar = shouldShowSidebar(pathname);
  const showBottomNav = shouldShowBottomTabBar(pathname);

  return (
    <>
      {showSidebar && <DesktopSidebar />}
      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col",
          showSidebar && "md:pl-24",
          showBottomNav && "pb-28 md:pb-0"
        )}
      >
        {children}
      </div>
      {showBottomNav && <BottomNav />}
    </>
  );
}
