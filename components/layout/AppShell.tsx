"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { shouldShowSidebar } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showSidebar = shouldShowSidebar(pathname);

  return (
    <>
      {showSidebar && <Sidebar />}
      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col",
          showSidebar && "md:pl-20"
        )}
      >
        {children}
      </div>
    </>
  );
}
