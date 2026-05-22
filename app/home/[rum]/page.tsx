import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd } from "@/lib/json-ld";
import {
  fetchHomePostsByCategory,
  fetchEngagementForViewer,
} from "@/lib/queries";
import { isCurrentUserAdmin } from "@/lib/admin";
import { homeVerticalVisible } from "@/lib/flags";
import { HOME_ROOMS, roomBySlug } from "@/lib/home-data";

export const dynamic = "force-dynamic";

export default async function HomeRoomPage({
  params,
}: {
  params: Promise<{ rum: string }>;
}) {
  const { rum } = await params;
  const room = roomBySlug(rum);
  if (!room) notFound();

  // Admin-only until launch — same gate as /home.
  if (!homeVerticalVisible(await isCurrentUserAdmin())) notFound();

  const posts = await fetchHomePostsByCategory(room.label);
  const { liked, saved } = await fetchEngagementForViewer(
    posts.map((o) => o.id),
  );

  return (
    <>
      <Header />
      {posts.length > 0 && (
        <JsonLd
          data={collectionPageJsonLd({
            path: `/home/${room.slug}`,
            name: `${room.label} – heminredning`,
            description: room.description,
            outfits: posts,
          })}
        />
      )}
      <main id="main" tabIndex={-1} className="flex-1 pt-6 md:pt-10">
        <Container>
          <nav
            aria-label="Brödsmulor"
            className="text-xs text-foreground-subtle mb-6"
          >
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Moidello
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/home" className="hover:text-foreground">
                  Heminredning
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground">{room.label}</li>
            </ol>
          </nav>

          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Alla rum
          </Link>

          <div className="mb-12 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-foreground-subtle mb-3">
              Rum
            </p>
            <h1 className="font-heading text-[44px] md:text-[72px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
              {room.label}
            </h1>
            <p className="mt-4 text-lg text-foreground-muted">
              {room.description}
            </p>
            {posts.length > 0 && (
              <p className="mt-3 text-sm text-foreground-subtle">
                {posts.length} rum från svenska kreatörer.
              </p>
            )}
          </div>

          {posts.length > 0 ? (
            <OutfitGrid
              outfits={posts}
              columns={3}
              liked={liked}
              saved={saved}
            />
          ) : (
            <div className="rounded-2xl border border-border bg-background-secondary p-10 text-center">
              <p className="text-foreground-muted">
                Inga {room.label.toLowerCase()} ännu — bli först att inreda.
              </p>
              <Link
                href="/skapa?vertical=hem"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Lägg upp ett rum
              </Link>
            </div>
          )}

          <section className="mt-20 mb-16 border-t border-border pt-10">
            <h2 className="text-xs uppercase tracking-[0.25em] text-foreground-subtle mb-5">
              Fler rum
            </h2>
            <ul className="flex flex-wrap gap-2">
              {HOME_ROOMS.filter((r) => r.slug !== room.slug).map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/home/${r.slug}`}
                    className="inline-block rounded-full border border-border bg-background-secondary px-4 py-2 text-sm text-foreground-muted hover:text-foreground hover:border-foreground/30 transition-colors"
                  >
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Container>
      </main>
    </>
  );
}
