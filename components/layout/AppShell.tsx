"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { BottomTabBar } from "./BottomTabBar";
import { shouldShowSidebar, shouldShowBottomTabBar } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showSidebar = shouldShowSidebar(pathname);
  const showBottomTabBar = shouldShowBottomTabBar(pathname);

  return (
    <>
      {showSidebar && <Sidebar />}
      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col",
          showSidebar && "md:pl-20",
          showBottomTabBar && "pb-24 md:pb-0"
        )}
      >
        {children}
      </div>
      {showBottomTabBar && <BottomTabBar />}
    </>
  );
}
