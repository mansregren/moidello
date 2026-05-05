import { Home, Compass, Plus, Tag, User, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
}

export const primaryNav: NavItem[] = [
  { href: "/feed", label: "Hem", icon: Home },
  { href: "/discover", label: "Upptäck", icon: Compass },
  { href: "/create", label: "Skapa", icon: Plus, primary: true },
  { href: "/brands", label: "Märken", icon: Tag },
  { href: "/profile", label: "Profil", icon: User },
];

export function isLandingRoute(pathname: string | null): boolean {
  return pathname === "/";
}

function isOnboardingRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

export function shouldShowSidebar(pathname: string | null): boolean {
  if (!pathname) return false;
  return !isLandingRoute(pathname) && !isOnboardingRoute(pathname);
}

export function shouldShowBottomTabBar(pathname: string | null): boolean {
  if (!pathname) return false;
  return !isOnboardingRoute(pathname);
}
