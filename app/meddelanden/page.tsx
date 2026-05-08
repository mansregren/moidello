import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { UserAvatar } from "@/components/user/UserAvatar";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface ConversationRow {
  id: string;
  user_a: string;
  user_b: string;
  last_message_at: string;
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

interface PreviewMessage {
  conversation_id: string;
  body: string;
  sender_id: string;
  read_at: string | null;
  created_at: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return "nu";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString("sv-SE");
}

export default async function MeddelandenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: convData, error: convError } = await supabase
    .from("conversations")
    .select(
      `id, user_a, user_b, last_message_at,
       user_a_profile:profiles!user_a(id, username, display_name, avatar_url),
       user_b_profile:profiles!user_b(id, username, display_name, avatar_url)`,
    )
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  const migrationMissing = convError?.code === "42P01";
  const conversations = (convData ?? []) as unknown as ConversationRow[];

  // Fetch latest message per conversation in one query
  const convIds = conversations.map((c) => c.id);
  let latest = new Map<string, PreviewMessage>();
  let unreadCounts = new Map<string, number>();

  if (convIds.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("conversation_id, body, sender_id, read_at, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false });

    for (const m of (msgs ?? []) as unknown as PreviewMessage[]) {
      if (!latest.has(m.conversation_id)) {
        latest.set(m.conversation_id, m);
      }
      if (m.sender_id !== user.id && !m.read_at) {
        unreadCounts.set(
          m.conversation_id,
          (unreadCounts.get(m.conversation_id) ?? 0) + 1,
        );
      }
    }
  }

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-6 md:pt-10">
        <Container className="max-w-3xl">
          <Link
            href="/profil"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka
          </Link>

          <h1 className="font-heading text-[40px] md:text-[64px] leading-[0.95] uppercase tracking-[-0.02em] text-white">
            Meddelanden
          </h1>

          {migrationMissing && (
            <p className="mt-6 text-sm text-amber-400">
              Tabellen finns inte ännu. Kör migration 0013_messaging.sql i Supabase.
            </p>
          )}

          {!migrationMissing && conversations.length === 0 && (
            <div className="mt-12 rounded-2xl border border-border bg-background-secondary p-10 text-center">
              <MessageCircle className="mx-auto h-10 w-10 text-foreground-subtle mb-3" />
              <p className="text-foreground-muted">
                Inga samtal än. Besök en profil och tryck &quot;Skicka meddelande&quot;
                för att börja.
              </p>
            </div>
          )}

          {conversations.length > 0 && (
            <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-background-secondary overflow-hidden">
              {conversations.map((c) => {
                const otherProfile =
                  c.user_a === user.id ? c.user_b_profile : c.user_a_profile;
                if (!otherProfile) return null;
                const preview = latest.get(c.id);
                const unread = unreadCounts.get(c.id) ?? 0;

                return (
                  <li key={c.id}>
                    <Link
                      href={`/meddelanden/${c.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                    >
                      <UserAvatar
                        src={otherProfile.avatar_url ?? ""}
                        alt={otherProfile.display_name ?? otherProfile.username}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p
                            className={`text-sm truncate ${
                              unread > 0
                                ? "text-white font-semibold"
                                : "text-white"
                            }`}
                          >
                            {otherProfile.display_name ?? otherProfile.username}
                          </p>
                          <p className="text-xs text-foreground-subtle shrink-0">
                            {timeAgo(c.last_message_at)}
                          </p>
                        </div>
                        <p
                          className={`mt-0.5 text-sm truncate ${
                            unread > 0 ? "text-foreground-muted" : "text-foreground-subtle"
                          }`}
                        >
                          {preview
                            ? `${preview.sender_id === user.id ? "Du: " : ""}${preview.body}`
                            : "Inga meddelanden ännu"}
                        </p>
                      </div>
                      {unread > 0 && (
                        <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white text-black px-1.5 text-[11px] font-bold">
                          {unread}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="py-16" />
        </Container>
      </main>
    </>
  );
}
