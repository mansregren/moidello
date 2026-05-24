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
  isFollowing: (userId: string) => boolean;
  isItemSaved: (taggedItemId: string) => boolean;
  markLiked: (outfitId: string, liked: boolean) => void;
  markSaved: (outfitId: string, saved: boolean) => void;
  markFollowing: (userId: string, following: boolean) => void;
  markItemSaved: (taggedItemId: string, saved: boolean) => void;
}

const ViewerEngagementContext = createContext<ViewerEngagementState | null>(
  null,
);

export function ViewerEngagementProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [follows, setFollows] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Logged out → nothing to show, and clear any state left from a previous
    // session on this tab.
    if (!isLoggedIn) {
      setLiked(new Set());
      setSaved(new Set());
      setFollows(new Set());
      setSavedItems(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const {
          liked: l,
          saved: s,
          follows: f,
          savedItems: si,
        } = await getViewerEngagement();
        if (cancelled) return;
        setLiked(new Set(l));
        setSaved(new Set(s));
        setFollows(new Set(f));
        setSavedItems(new Set(si));
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

  const markFollowing = useCallback((userId: string, value: boolean) => {
    setFollows((prev) => {
      const next = new Set(prev);
      if (value) next.add(userId);
      else next.delete(userId);
      return next;
    });
  }, []);

  const markItemSaved = useCallback((taggedItemId: string, value: boolean) => {
    setSavedItems((prev) => {
      const next = new Set(prev);
      if (value) next.add(taggedItemId);
      else next.delete(taggedItemId);
      return next;
    });
  }, []);

  const value = useMemo<ViewerEngagementState>(
    () => ({
      isLiked: (id) => liked.has(id),
      isSaved: (id) => saved.has(id),
      isFollowing: (id) => follows.has(id),
      isItemSaved: (id) => savedItems.has(id),
      markLiked,
      markSaved,
      markFollowing,
      markItemSaved,
    }),
    [
      liked,
      saved,
      follows,
      savedItems,
      markLiked,
      markSaved,
      markFollowing,
      markItemSaved,
    ],
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
      isFollowing: () => false,
      isItemSaved: () => false,
      markLiked: () => {},
      markSaved: () => {},
      markFollowing: () => {},
      markItemSaved: () => {},
    };
  }
  return ctx;
}
