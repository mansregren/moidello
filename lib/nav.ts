import { Home, Search, Plus, Sparkles, User, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
  /** If set, clicking the tab triggers this auth action when logged out instead of navigating. */
  authAction?: "create" | "profile";
}

export const primaryNav: NavItem[] = [
  { href: "/", label: "Hem", icon: Home },
  { href: "/upptack", label: "Upptäck", icon: Search },
  { href: "/skapa", label: "Skapa", icon: Plus, primary: true, authAction: "create" },
  { href: "/trendigt", label: "Trendigt", icon: Sparkles },
  { href: "/profil", label: "Profil", icon: User, authAction: "profile" },
];

export function isLandingRoute(pathname: string | null): boolean {
  return pathname === "/welcome";
}

function isOnboardingRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

function isAuthRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/")
  );
}

function isFullscreenModalRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  // /skapa is treated as a fullscreen modal — both nav surfaces hide.
  return pathname === "/skapa" || pathname.startsWith("/skapa/");
}

function isChromeExcluded(pathname: string | null): boolean {
  return (
    isLandingRoute(pathname) ||
    isOnboardingRoute(pathname) ||
    isAuthRoute(pathname) ||
    isFullscreenModalRoute(pathname)
  );
}

export function shouldShowSidebar(pathname: string | null): boolean {
  if (!pathname) return false;
  return !isChromeExcluded(pathname);
}

export function shouldShowBottomTabBar(pathname: string | null): boolean {
  if (!pathname) return false;
  return !isChromeExcluded(pathname);
}

export function shouldShowAppHeader(pathname: string | null): boolean {
  return shouldShowSidebar(pathname);
}
