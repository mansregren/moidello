import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { UserAvatar } from "@/components/user/UserAvatar";
import { FollowButton } from "@/components/user/FollowButton";
import { createClient } from "@/lib/supabase/server";
import {
  fetchFollowingFeed,
  fetchEngagementForViewer,
} from "@/lib/queries";
import { fetchTopCreatorsCached as fetchTopCreators } from "@/lib/queries-cached";
import { FoljerClient } from "./FoljerClient";

export const metadata = {
  title: "Följer",
  description: "Outfits från kreatörer du följer.",
  alternates: { canonical: "/foljer" },
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default async function FoljerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const creators = await fetchTopCreators(12);
    return <Shell mode="logged-out" creators={creators} outfits={[]} />;
  }

  const outfits = await fetchFollowingFeed(user.id, 30);

  if (outfits.length === 0) {
    const creators = await fetchTopCreators(12);
    return (
      <Shell
        mode="empty"
        creators={creators}
        outfits={[]}
      />
    );
  }

  const { liked, saved } = await fetchEngagementForViewer(
    outfits.map((o) => o.id),
  );

  return (
    <Shell
      mode="feed"
      creators={[]}
      outfits={outfits}
      likedIds={Array.from(liked)}
      savedIds={Array.from(saved)}
    />
  );
}

function Shell({
  mode,
  creators,
  outfits,
  likedIds = [],
  savedIds = [],
}: {
  mode: "feed" | "empty" | "logged-out";
  creators: Awaited<ReturnType<typeof fetchTopCreators>>;
  outfits: Awaited<ReturnType<typeof fetchFollowingFeed>>;
  likedIds?: string[];
  savedIds?: string[];
}) {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 pt-20 md:pt-24 pb-16">
        <Container>
          <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-3">
            Följer
          </p>
          <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tight leading-none">
            {mode === "feed"
              ? "Senast från dina följda"
              : "Bygg ditt flöde"}
          </h1>
          <p className="mt-6 text-foreground-muted max-w-2xl">
            {mode === "feed"
              ? "Nya outfits från kreatörerna du följer."
              : mode === "empty"
                ? "Du följer inte någon än. Börja med kreatörerna nedan så fylls ditt flöde här."
                : "Logga in för att bygga ditt personliga flöde. Här är kreatörer som är värda att följa."}
          </p>

          {mode === "feed" && (
            <section className="mt-12">
              <FoljerClient
                outfits={outfits}
                likedIds={likedIds}
                savedIds={savedIds}
              />
            </section>
          )}

          {(mode === "empty" || mode === "logged-out") && (
            <section className="mt-12">
              <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider mb-6">
                Förslag på kreatörer
              </h2>
              {creators.length === 0 ? (
                <p className="text-foreground-muted">
                  Inga kreatörer än. Bli först ut —{" "}
                  <Link
                    href="/skapa"
                    className="text-white underline hover:text-white/80"
                  >
                    skapa en outfit
                  </Link>
                  .
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {creators.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-background-secondary hover:border-white/30 transition-colors"
                    >
                      <Link
                        href={`/profile/${c.username}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <UserAvatar
                          src={c.avatar ?? ""}
                          alt={c.displayName}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {c.displayName}
                          </p>
                          <p className="text-xs text-foreground-subtle truncate">
                            @{c.username} · {c.outfitCount}{" "}
                            {c.outfitCount === 1 ? "outfit" : "outfits"}
                          </p>
                        </div>
                      </Link>
                      <FollowButton userId={c.id} />
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-8 text-sm text-foreground-subtle">
                Eller bläddra hela katalogen på{" "}
                <Link
                  href="/upptack"
                  className="text-white underline hover:text-white/80"
                >
                  Upptäck
                </Link>
                .
              </p>
            </section>
          )}
        </Container>
      </main>
    </>
  );
}
