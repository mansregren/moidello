"use client";

import { useCallback, useSyncExternalStore, ReactNode } from "react";
import { GenderFilter } from "./types";

const STORAGE_KEY = "moidello-gender-filter";
const EVENT_NAME = "moidello-gender-filter:change";
const DEFAULT_FILTER: GenderFilter = "dam";

function isValidFilter(value: string | null): value is GenderFilter {
  return value === "dam" || value === "herr";
}

function readGender(): GenderFilter {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isValidFilter(stored) ? stored : DEFAULT_FILTER;
  } catch {
    return DEFAULT_FILTER;
  }
}

function subscribe(callback: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT_NAME, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT_NAME, callback);
  };
}

const getServerSnapshot = (): GenderFilter => DEFAULT_FILTER;

/**
 * Kept for layout-level backwards compat. Provides no context — useGender
 * reads directly from localStorage via useSyncExternalStore.
 */
export function GenderProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useGender() {
  const gender = useSyncExternalStore(subscribe, readGender, getServerSnapshot);

  const setGender = useCallback((g: GenderFilter) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, g);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return { gender, setGender };
}

export function matchesGenderFilter(
  outfitGender: "herr" | "dam",
  filter: GenderFilter
): boolean {
  return outfitGender === filter;
}
