"use client";

import {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { GenderFilter } from "./types";

const STORAGE_KEY = "moidello-gender-filter";
export const GENDER_COOKIE = "moidello_gender_pref";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const DEFAULT_FILTER: GenderFilter = "dam";

function isValidFilter(value: string | null | undefined): value is GenderFilter {
  return value === "dam" || value === "herr";
}

interface GenderState {
  gender: GenderFilter;
  setGender: (g: GenderFilter) => void;
}

const GenderContext = createContext<GenderState | null>(null);

/**
 * Provider seeded server-side with a cookie value. SSR + first paint both
 * render with the same gender so users on the Herr filter don't get a
 * dam-content flash. After mount we also reconcile with localStorage,
 * which is the legacy source of truth and may differ on devices where
 * the cookie hasn't been written yet (e.g. an old client).
 */
export function GenderProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: GenderFilter;
}) {
  const [gender, setGenderState] = useState<GenderFilter>(
    isValidFilter(initial) ? initial : DEFAULT_FILTER,
  );

  useEffect(() => {
    let cancelled = false;

    // Reconcile with localStorage on mount. If a Herr user visited before
    // we wrote the cookie, localStorage still wins.
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isValidFilter(stored) && !cancelled) {
        setGenderState((prev) => (prev === stored ? prev : stored));
        // Also seed the cookie so future SSR is in sync.
        writeCookie(stored);
      }
    } catch {
      // ignore
    }

    // Cross-tab sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && isValidFilter(e.newValue)) {
        setGenderState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setGender = useCallback((g: GenderFilter) => {
    setGenderState(g);
    try {
      window.localStorage.setItem(STORAGE_KEY, g);
    } catch {
      // ignore
    }
    writeCookie(g);
  }, []);

  return (
    <GenderContext.Provider value={{ gender, setGender }}>
      {children}
    </GenderContext.Provider>
  );
}

function writeCookie(g: GenderFilter) {
  if (typeof document === "undefined") return;
  const attrs = [
    `${GENDER_COOKIE}=${g}`,
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

export function useGender(): GenderState {
  const ctx = useContext(GenderContext);
  if (!ctx) {
    // Fallback for components rendered outside the provider (shouldn't
    // happen in this app but keeps tests + storybook safe).
    return { gender: DEFAULT_FILTER, setGender: () => {} };
  }
  return ctx;
}

export function matchesGenderFilter(
  outfitGender: "herr" | "dam",
  filter: GenderFilter,
): boolean {
  return outfitGender === filter;
}
