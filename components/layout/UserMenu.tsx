"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut, User as UserIcon, Plus, Bookmark, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserAvatar } from "@/components/user/UserAvatar";
import { useAuth } from "@/lib/auth-context";

export function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  // Prefer the avatar from the profiles row (updated via /profil edit) over
  // the OAuth metadata which only reflects what the provider returned at
  // sign-up time.
  const avatarUrl =
    profile?.avatarUrl ??
    (user.user_metadata?.avatar_url as string | undefined) ??
    "";
  const email = user.email ?? "";

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    router.push("/");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Användarmeny"
        className="rounded-full transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <UserAvatar src={avatarUrl} alt={email || "Konto"} size="sm" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            role="menu"
            className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-background-secondary border border-border shadow-2xl shadow-black/50 overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs text-foreground-subtle uppercase tracking-wider">
                Inloggad som
              </p>
              <p className="text-sm text-foreground truncate mt-0.5">{email}</p>
            </div>
            <ul className="py-1">
              <MenuItem
                href="/profil"
                icon={UserIcon}
                onClick={() => setOpen(false)}
              >
                Min profil
              </MenuItem>
              <MenuItem
                href="/meddelanden"
                icon={MessageCircle}
                onClick={() => setOpen(false)}
              >
                Meddelanden
              </MenuItem>
              <MenuItem
                href="/skapa"
                icon={Plus}
                onClick={() => setOpen(false)}
              >
                Skapa outfit
              </MenuItem>
              <MenuItem
                href="/profil"
                icon={Bookmark}
                onClick={() => setOpen(false)}
              >
                Sparade
              </MenuItem>
              <li>
                <button
                  type="button"
                  onClick={handleSignOut}
                  role="menuitem"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-foreground/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logga ut
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: typeof UserIcon;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        role="menuitem"
        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-foreground/5 transition-colors"
      >
        <Icon className="h-4 w-4" />
        {children}
      </Link>
    </li>
  );
}
