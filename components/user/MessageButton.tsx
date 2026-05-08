"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getOrCreateConversation } from "@/app/actions/messaging";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function MessageButton({ userId }: { userId: string }) {
  const router = useRouter();
  const { user, isLoggedIn, requireAuth } = useAuth();
  const [pending, startTransition] = useTransition();

  if (user?.id === userId) return null;

  // Seed/mock profiles aren't real auth users — DM would crash on the
  // uuid foreign key. Render a disabled, explanatory button instead.
  const isPersisted = UUID_RE.test(userId);
  if (!isPersisted) {
    return (
      <button
        type="button"
        disabled
        title="Detta är ett demo-konto. Meddelanden funkar mellan riktiga konton."
        className="inline-flex items-center gap-2 rounded-full border border-border text-foreground-subtle px-5 py-2 text-sm font-medium cursor-not-allowed opacity-60"
      >
        <MessageCircle className="h-4 w-4" />
        Demo-konto
      </button>
    );
  }

  const handleClick = () => {
    if (!isLoggedIn) {
      requireAuth("follow");
      return;
    }
    startTransition(async () => {
      const res = await getOrCreateConversation(userId);
      if (res.ok && res.conversationId) {
        router.push(`/meddelanden/${res.conversationId}`);
      } else {
        console.error("[MessageButton] failed to open conversation:", res.error);
        alert(`Kunde inte öppna samtalet: ${res.error ?? "okänt fel"}`);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full border border-border text-white px-5 py-2 text-sm font-medium hover:border-white/30 transition-colors disabled:opacity-60"
    >
      <MessageCircle className="h-4 w-4" />
      {pending ? "Öppnar…" : "Skicka meddelande"}
    </button>
  );
}
