"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "./Footer";
import { shouldShowFooter } from "@/lib/nav";

export function AppShell({
  children,
  footerBg,
}: {
  children: ReactNode;
  footerBg?: string;
}) {
  const pathname = usePathname();
  const showFooter = shouldShowFooter(pathname);

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      {children}
      {showFooter && <Footer bg={footerBg} />}
    </div>
  );
}
