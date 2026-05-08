"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getOrCreateConversation } from "@/app/actions/messaging";

export function MessageButton({ userId }: { userId: string }) {
  const router = useRouter();
  const { user, isLoggedIn, requireAuth } = useAuth();
  const [pending, startTransition] = useTransition();

  if (user?.id === userId) return null;

  const handleClick = () => {
    if (!isLoggedIn) {
      requireAuth("follow");
      return;
    }
    startTransition(async () => {
      const res = await getOrCreateConversation(userId);
      if (res.ok && res.conversationId) {
        router.push(`/meddelanden/${res.conversationId}`);
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
