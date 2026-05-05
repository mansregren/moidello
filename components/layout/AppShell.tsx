"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { BottomTabBar } from "./BottomTabBar";
import { shouldShowAppNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showAppNav = shouldShowAppNav(pathname);

  return (
    <>
      {showAppNav && <Sidebar />}
      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col",
          showAppNav && "md:pl-20 pb-24 md:pb-0"
        )}
      >
        {children}
      </div>
      {showAppNav && <BottomTabBar />}
    </>
  );
}
