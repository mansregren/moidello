"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { X, Heart, Bookmark, UserPlus, Plus, User } from "lucide-react";

export type AuthAction =
  | "like"
  | "save"
  | "follow"
  | "create"
  | "profile"
  | "comment";

const PROMPTS: Record<AuthAction, { title: string; icon: typeof Heart }> = {
  like: { title: "Skapa konto för att gilla", icon: Heart },
  save: { title: "Skapa konto för att spara", icon: Bookmark },
  follow: { title: "Skapa konto för att följa", icon: UserPlus },
  create: { title: "Skapa konto för att lägga upp outfits", icon: Plus },
  profile: { title: "Logga in för att se din profil", icon: User },
  comment: { title: "Skapa konto för att kommentera", icon: Heart },
};

interface AuthContextValue {
  isLoggedIn: boolean;
  /** Returns true if user is logged in (action can proceed). False = prompt was shown. */
  requireAuth: (action: AuthAction) => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  requireAuth: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // Phase 1: always logged-out (Pinterest model)
  const isLoggedIn = false;
  const [activePrompt, setActivePrompt] = useState<AuthAction | null>(null);

  const requireAuth = useCallback(
    (action: AuthAction): boolean => {
      if (isLoggedIn) return true;
      setActivePrompt(action);
      return false;
    },
    [isLoggedIn]
  );

  return (
    <AuthContext.Provider value={{ isLoggedIn, requireAuth }}>
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
            href="/signup"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-3 text-sm font-medium transition-transform active:scale-[0.98]"
          >
            Skapa konto
          </Link>
          <Link
            href="/login"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-border text-white px-6 py-3 text-sm font-medium transition-colors hover:border-white/30"
          >
            Logga in
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
