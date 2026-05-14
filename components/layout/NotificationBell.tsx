"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Heart, UserPlus, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/user/UserAvatar";

type NotificationType = "like" | "follow" | "comment";

interface NotificationActor {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface NotificationRow {
  id: string;
  type: NotificationType;
  outfit_id: string | null;
  comment_id: string | null;
  read_at: string | null;
  created_at: string;
  actor: NotificationActor | null;
}

const TYPE_ICON: Record<NotificationType, typeof Heart> = {
  like: Heart,
  follow: UserPlus,
  comment: MessageCircle,
};

function describe(n: NotificationRow): string {
  const who = n.actor?.display_name ?? n.actor?.username ?? "Någon";
  switch (n.type) {
    case "like":
      return `${who} gillade din outfit`;
    case "follow":
      return `${who} följer dig`;
    case "comment":
      return `${who} kommenterade din outfit`;
  }
}

function targetHref(n: NotificationRow): string {
  if (n.type === "follow") {
    return n.actor ? `/profile/${n.actor.username}` : "/";
  }
  return n.outfit_id ? `/outfit/${n.outfit_id}` : "/";
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString("sv-SE");
}

export function NotificationBell() {
  const { user, isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch on mount + when user changes
  useEffect(() => {
    if (!isLoggedIn || !user) {
      setNotifs([]);
      setUnreadCount(0);
      return;
    }
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select(
          `id, type, outfit_id, comment_id, read_at, created_at,
           actor:profiles!actor_id(username, display_name, avatar_url)`,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (cancelled) return;
      if (error) {
        // 42P01 = table doesn't exist (migration not yet applied)
        setLoading(false);
        return;
      }
      const list = (data ?? []) as unknown as NotificationRow[];
      setNotifs(list);
      setUnreadCount(list.filter((n) => !n.read_at).length);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isLoggedIn]);

  // Click outside / Escape to close
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!user || unreadCount === 0) return;

    // Optimistic: clear badge immediately
    setUnreadCount(0);
    const now = new Date().toISOString();
    setNotifs((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: now })),
    );

    // Persist
    const supabase = createClient();
    supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", user.id)
      .is("read_at", null)
      .then(() => {});
  };

  if (!isLoggedIn) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifikationer"
        aria-expanded={open}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-foreground/5 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} olästa`}
            className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-y-auto rounded-2xl bg-background-secondary border border-foreground/10 shadow-2xl shadow-black/50 z-50"
          >
            <div className="p-4 border-b border-foreground/5">
              <p className="text-sm font-semibold text-foreground">Notifikationer</p>
            </div>

            {loading && notifs.length === 0 && (
              <p className="p-4 text-sm text-foreground-subtle">Laddar…</p>
            )}

            {!loading && notifs.length === 0 && (
              <p className="p-4 text-sm text-foreground-muted">
                Inga notifikationer än. Aktivitet på dina outfits dyker upp här.
              </p>
            )}

            <ul className="divide-y divide-foreground/5">
              {notifs.map((n) => {
                const Icon = TYPE_ICON[n.type];
                const unread = !n.read_at;
                return (
                  <li key={n.id}>
                    <Link
                      href={targetHref(n)}
                      onClick={() => setOpen(false)}
                      className={`flex items-start gap-3 p-4 hover:bg-foreground/5 transition-colors ${
                        unread ? "bg-foreground/[0.02]" : ""
                      }`}
                    >
                      <div className="relative shrink-0">
                        <UserAvatar
                          src={n.actor?.avatar_url ?? ""}
                          alt={n.actor?.display_name ?? ""}
                          size="sm"
                        />
                        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                          <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">
                          {describe(n)}
                        </p>
                        <p className="text-xs text-foreground-subtle mt-0.5">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      {unread && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
