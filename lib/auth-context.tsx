"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { X, Heart, Bookmark, UserPlus, Plus, User, Flag } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type AuthAction =
  | "like"
  | "save"
  | "follow"
  | "create"
  | "profile"
  | "comment"
  | "report";

export interface AuthProfile {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

const PROMPTS: Record<AuthAction, { title: string; icon: typeof Heart }> = {
  like: { title: "Skapa konto för att gilla", icon: Heart },
  save: { title: "Skapa konto för att spara", icon: Bookmark },
  follow: { title: "Skapa konto för att följa", icon: UserPlus },
  create: { title: "Skapa konto för att lägga upp outfits", icon: Plus },
  profile: { title: "Logga in för att se din profil", icon: User },
  comment: { title: "Skapa konto för att kommentera", icon: Heart },
  report: { title: "Logga in för att rapportera", icon: Flag },
};

interface AuthContextValue {
  user: SupabaseUser | null;
  profile: AuthProfile | null;
  isLoggedIn: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  /** Returns true if user is logged in (action can proceed). False = prompt was shown. */
  requireAuth: (action: AuthAction) => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isLoggedIn: false,
  loading: true,
  signOut: async () => {},
  requireAuth: () => false,
});

export function AuthProvider({
  children,
  initialUser = null,
  initialProfile = null,
}: {
  children: ReactNode;
  initialUser?: SupabaseUser | null;
  initialProfile?: AuthProfile | null;
}) {
  const [user, setUser] = useState<SupabaseUser | null>(initialUser);
  const [profile, setProfile] = useState<AuthProfile | null>(initialProfile);
  // If we already have a user from the server, we're not "loading" — the
  // header can render the logged-in state on first paint with no flash.
  const [loading, setLoading] = useState(initialUser === null);
  const [activePrompt, setActivePrompt] = useState<AuthAction | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Only re-check on mount if we don't already have a server-seeded user.
    if (initialUser !== null) {
      return undefined;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // When the user signs out we should clear the cached profile too.
      if (!session?.user) setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Refresh profile when user changes (e.g. after sign-in via OAuth)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      setProfile({
        username: data.username as string,
        displayName: (data.display_name as string | null) ?? null,
        avatarUrl: (data.avatar_url as string | null) ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  const isLoggedIn = !!user;

  const requireAuth = useCallback(
    (action: AuthAction): boolean => {
      if (isLoggedIn) return true;
      setActivePrompt(action);
      return false;
    },
    [isLoggedIn],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{ user, profile, isLoggedIn, loading, signOut, requireAuth }}
    >
      {children}
      <AnimatePresence>
        {activePrompt && (
          <AuthPrompt
            action={activePrompt}
            onClose={() => setActivePrompt(null)}
          />
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function AuthPrompt({
  action,
  onClose,
}: {
  action: AuthAction;
  onClose: () => void;
}) {
  const config = PROMPTS[action];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-background-secondary border border-white/10 p-8 relative"
      >
        <button
          onClick={onClose}
          aria-label="Stäng"
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted hover:bg-white/5 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black mb-5">
          <Icon className="h-5 w-5" />
        </div>

        <h2 className="font-heading text-3xl uppercase tracking-tight text-white leading-tight">
          {config.title}
        </h2>
        <p className="mt-3 text-sm text-foreground-muted">
          Det är gratis och tar 30 sekunder. Spara, gilla och följ kreatörer du älskar.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <Link
            href="/login"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-3 text-sm font-medium transition-transform active:scale-[0.98]"
          >
            Skapa konto / logga in
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
