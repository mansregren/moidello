"use client";

import {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light";

export const THEME_COOKIE = "moidello_theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const DEFAULT_THEME: Theme = "light";

function isValidTheme(v: string | null | undefined): v is Theme {
  return v === "dark" || v === "light";
}

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

/**
 * Theme provider, seeded server-side from the `moidello_theme` cookie so
 * SSR and first paint agree (no flash). Mirrors the GenderProvider
 * pattern. The actual colours live in app/globals.css under
 * `:root[data-theme="light"]`; this just flips the attribute + cookie.
 */
export function ThemeProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(
    isValidTheme(initial) ? initial : DEFAULT_THEME,
  );

  // Keep <html data-theme> in sync with state after any change.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    writeCookie(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      writeCookie(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function writeCookie(t: Theme) {
  if (typeof document === "undefined") return;
  const attrs = [
    `${THEME_COOKIE}=${t}`,
    "path=/",
    `max-age=${COOKIE_MAX_AGE}`,
    "samesite=lax",
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "secure"
      : "",
  ]
    .filter(Boolean)
    .join("; ");
  try {
    document.cookie = attrs;
  } catch {
    // ignore
  }
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback for components rendered outside the provider.
    return { theme: DEFAULT_THEME, setTheme: () => {}, toggleTheme: () => {} };
  }
  return ctx;
}
