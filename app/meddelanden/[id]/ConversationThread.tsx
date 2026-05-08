"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { UserAvatar } from "@/components/user/UserAvatar";
import { sendMessage } from "@/app/actions/messaging";
import { createClient } from "@/lib/supabase/client";
import {
  OutfitShareCard,
  ItemShareCard,
  type OutfitShareData,
  type ItemShareData,
} from "@/components/messaging/ShareCards";

type ContentType = "text" | "outfit_share" | "item_share";

export interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  content_type?: ContentType;
  content_data?: Record<string, unknown> | null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function ConversationThread({
  conversationId,
  currentUserId,
  initialMessages,
  otherAvatar,
  otherName,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  otherAvatar: string;
  otherName: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // Realtime: append incoming messages
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((p) => p.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || pending) return;

    // Optimistic append
    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      sender_id: currentUserId,
      body: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setBody("");
    setError(null);

    startTransition(async () => {
      const res = await sendMessage(conversationId, text);
      if (!res.ok) {
        // Roll back optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setError(res.error ?? "Kunde inte skicka.");
        setBody(text);
      }
      // The realtime subscription will eventually replace the optimistic
      // row with the persisted one (matching by id is fine since the real
      // id won't collide with our optimistic prefix).
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        {messages.length === 0 && (
          <p className="text-center text-sm text-foreground-subtle py-12">
            Inga meddelanden ännu. Säg hej!
          </p>
        )}
        {messages.map((m, i) => {
          const isMine = m.sender_id === currentUserId;
          const prev = messages[i - 1];
          const newDay =
            !prev ||
            new Date(prev.created_at).toDateString() !==
              new Date(m.created_at).toDateString();
          return (
            <div key={m.id}>
              {newDay && (
                <p className="text-center text-[11px] uppercase tracking-wider text-foreground-subtle py-3">
                  {formatDay(m.created_at)}
                </p>
              )}
              <div
                className={`flex items-end gap-2 ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                {!isMine && (
                  <UserAvatar src={otherAvatar} alt={otherName} size="sm" />
                )}
                <div className="flex flex-col items-end gap-1 max-w-[80%]">
                  {m.content_type === "outfit_share" && m.content_data && (
                    <OutfitShareCard
                      fromMe={isMine}
                      data={m.content_data as unknown as OutfitShareData}
                    />
                  )}
                  {m.content_type === "item_share" && m.content_data && (
                    <ItemShareCard
                      fromMe={isMine}
                      data={m.content_data as unknown as ItemShareData}
                    />
                  )}
                  {m.body && (
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        isMine
                          ? "bg-white text-black rounded-br-sm"
                          : "bg-background-secondary text-white rounded-bl-sm"
                      } self-${isMine ? "end" : "start"}`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {m.body}
                      </p>
                    </div>
                  )}
                  <p
                    className={`text-[10px] tabular-nums text-foreground-subtle ${
                      isMine ? "self-end" : "self-start"
                    }`}
                  >
                    {formatTime(m.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={submit}
        className="sticky bottom-4 flex items-end gap-2 rounded-2xl border border-border bg-background-secondary p-2 shadow-2xl shadow-black/40"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
          placeholder="Skriv ett meddelande…"
          rows={1}
          maxLength={4000}
          className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white placeholder:text-foreground-subtle outline-none max-h-32"
        />
        <button
          type="submit"
          disabled={pending || !body.trim()}
          aria-label="Skicka"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-40 hover:bg-white/90 active:scale-95 transition-transform"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
