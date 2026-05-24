"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth-context";
import { getViewerEngagement } from "@/app/actions/engagement";

/**
 * Viewer engagement (which outfits the current user has liked / saved) lives
 * here on the client instead of being fetched per-page on the server. That's
 * what lets public pages be statically / ISR cached: the cached HTML carries
 * no per-viewer state, and this provider hydrates liked/saved after mount.
 *
 * OutfitCard reads membership from here and calls markLiked/markSaved on
 * toggle, so a like on one card is reflected on every card app-wide and
 * persists across client navigations.
 */
interface ViewerEngagementState {
  isLiked: (outfitId: string) => boolean;
  isSaved: (outfitId: string) => boolean;
  markLiked: (outfitId: string, liked: boolean) => void;
  markSaved: (outfitId: string, saved: boolean) => void;
}

const ViewerEngagementContext = createContext<ViewerEngagementState | null>(
  null,
);

export function ViewerEngagementProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Logged out → nothing to show, and clear any state left from a previous
    // session on this tab.
    if (!isLoggedIn) {
      setLiked(new Set());
      setSaved(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { liked: l, saved: s } = await getViewerEngagement();
        if (cancelled) return;
        setLiked(new Set(l));
        setSaved(new Set(s));
      } catch {
        // Leave empty on failure — buttons just start un-toggled.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const markLiked = useCallback((outfitId: string, value: boolean) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (value) next.add(outfitId);
      else next.delete(outfitId);
      return next;
    });
  }, []);

  const markSaved = useCallback((outfitId: string, value: boolean) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (value) next.add(outfitId);
      else next.delete(outfitId);
      return next;
    });
  }, []);

  const value = useMemo<ViewerEngagementState>(
    () => ({
      isLiked: (id) => liked.has(id),
      isSaved: (id) => saved.has(id),
      markLiked,
      markSaved,
    }),
    [liked, saved, markLiked, markSaved],
  );

  return (
    <ViewerEngagementContext.Provider value={value}>
      {children}
    </ViewerEngagementContext.Provider>
  );
}

export function useViewerEngagement(): ViewerEngagementState {
  const ctx = useContext(ViewerEngagementContext);
  if (!ctx) {
    // Safe no-op fallback for components rendered outside the provider.
    return {
      isLiked: () => false,
      isSaved: () => false,
      markLiked: () => {},
      markSaved: () => {},
    };
  }
  return ctx;
}
