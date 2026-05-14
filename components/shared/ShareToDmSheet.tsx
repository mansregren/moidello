"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Search, Send } from "lucide-react";
import { UserAvatar } from "@/components/user/UserAvatar";
import {
  fetchShareRecipients,
  sendShare,
  type ShareRecipient,
} from "@/app/actions/messaging";

type ShareKind = "outfit_share" | "item_share";

export function ShareToDmSheet({
  open,
  onClose,
  type,
  refId,
  title,
}: {
  open: boolean;
  onClose: () => void;
  type: ShareKind;
  refId: string;
  /** Display title for the modal header — eg outfit name or "Totême — Cashmere Cardigan" */
  title: string;
}) {
  const router = useRouter();
  const [recipients, setRecipients] = useState<ShareRecipient[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setRecipients(null);
    setSelected(new Set());
    setQuery("");
    setMessage("");
    setError(null);
    fetchShareRecipients().then(setRecipients);
  }, [open]);

  const filtered = useMemo(() => {
    if (!recipients) return [];
    const q = query.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      (r) =>
        r.username.toLowerCase().includes(q) ||
        r.displayName.toLowerCase().includes(q),
    );
  }, [recipients, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = () => {
    if (selected.size === 0) {
      setError("Välj minst en mottagare");
      return;
    }
    startTransition(async () => {
      const res = await sendShare({
        recipientIds: Array.from(selected),
        type,
        refId,
        message: message.trim() || undefined,
      });
      if (res.ok) {
        onClose();
        if (res.conversationId && selected.size === 1) {
          router.push(`/meddelanden/${res.conversationId}`);
        }
      } else {
        setError(res.error ?? "Kunde inte skicka");
      }
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-background-secondary border border-foreground/10 p-6"
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="font-heading text-2xl uppercase tracking-tight text-foreground leading-tight">
                  Skicka till
                </h2>
                <p className="text-xs text-foreground-subtle mt-1 truncate">
                  {title}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Stäng"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground-muted hover:bg-foreground/5 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sök bland följda och följare…"
                className="w-full rounded-xl bg-background-tertiary border border-border pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle outline-none focus:border-foreground/30"
              />
            </div>

            {recipients === null && (
              <p className="text-sm text-foreground-subtle py-6">Laddar…</p>
            )}

            {recipients && recipients.length === 0 && (
              <p className="text-sm text-foreground-muted py-4">
                Du har inga följda eller följare än. Följ någon först för att
                kunna dela.
              </p>
            )}

            {recipients && recipients.length > 0 && (
              <ul className="divide-y divide-border max-h-72 overflow-y-auto -mx-1">
                {filtered.map((r) => {
                  const isSelected = selected.has(r.id);
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => toggle(r.id)}
                        className="w-full flex items-center gap-3 px-1 py-3 text-left hover:bg-foreground/5 rounded-lg"
                      >
                        <UserAvatar
                          src={r.avatarUrl ?? ""}
                          alt={r.displayName}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {r.displayName}
                          </p>
                          <p className="text-xs text-foreground-subtle truncate">
                            @{r.username}
                          </p>
                        </div>
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                            isSelected
                              ? "bg-foreground text-background border-foreground"
                              : "border-border text-foreground-subtle"
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Lägg till en text (valfritt)…"
              rows={2}
              maxLength={500}
              className="mt-4 w-full resize-none rounded-xl bg-background-tertiary border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle outline-none focus:border-foreground/30"
            />

            {error && (
              <p className="mt-3 text-sm text-red-400">{error}</p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={pending || selected.size === 0}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background py-3 text-sm font-semibold hover:bg-foreground/90 transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {pending
                ? "Skickar…"
                : selected.size > 0
                  ? `Skicka till ${selected.size}`
                  : "Skicka"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
