"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

/**
 * Dark/light theme switch. Uses theme tokens so the control itself
 * adapts to whichever theme is active.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Byt till ljust tema" : "Byt till mörkt tema"}
      title={isDark ? "Ljust tema" : "Mörkt tema"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
