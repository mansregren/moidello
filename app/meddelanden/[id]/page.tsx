import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { UserAvatar } from "@/components/user/UserAvatar";
import { createClient } from "@/lib/supabase/server";
import { markConversationRead } from "@/app/actions/messaging";
import { ConversationThread } from "./ConversationThread";

export const dynamic = "force-dynamic";

interface ConversationRow {
  id: string;
  user_a: string;
  user_b: string;
  user_a_profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  user_b_profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: convData, error: convError } = await supabase
    .from("conversations")
    .select(
      `id, user_a, user_b,
       user_a_profile:profiles!user_a(id, username, display_name, avatar_url),
       user_b_profile:profiles!user_b(id, username, display_name, avatar_url)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (convError?.code === "42P01") {
    notFound();
  }
  if (!convData) notFound();
  const conversation = convData as unknown as ConversationRow;

  if (conversation.user_a !== user.id && conversation.user_b !== user.id) {
    notFound();
  }

  const otherProfile =
    conversation.user_a === user.id
      ? conversation.user_b_profile
      : conversation.user_a_profile;
  if (!otherProfile) notFound();

  const { data: msgData } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, read_at, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  // Mark unread incoming messages as read on view (fire-and-forget;
  // the action revalidates /meddelanden so the inbox count updates).
  await markConversationRead(id);

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-6 md:pt-10">
        <Container className="max-w-2xl">
          <Link
            href="/meddelanden"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Inkorg
          </Link>

          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
            <UserAvatar
              src={otherProfile.avatar_url ?? ""}
              alt={otherProfile.display_name ?? otherProfile.username}
              size="md"
            />
            <div className="min-w-0">
              <Link
                href={`/profile/${otherProfile.username}`}
                className="font-medium text-white truncate hover:underline"
              >
                {otherProfile.display_name ?? otherProfile.username}
              </Link>
              <p className="text-xs text-foreground-subtle">
                @{otherProfile.username}
              </p>
            </div>
          </div>

          <ConversationThread
            conversationId={id}
            currentUserId={user.id}
            initialMessages={(msgData ?? []) as unknown as Array<{
              id: string;
              sender_id: string;
              body: string;
              created_at: string;
            }>}
            otherAvatar={otherProfile.avatar_url ?? ""}
            otherName={otherProfile.display_name ?? otherProfile.username}
          />

          <div className="py-12" />
        </Container>
      </main>
    </>
  );
}
