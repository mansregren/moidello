import Image from "next/image";
import Link from "next/link";
import { Search, Bookmark, ShoppingBag, Plus, Users, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { pickBgs, HERO_POOL } from "@/lib/session-background";
import { OUTFIT_CREATE_PUBLIC } from "@/lib/flags";

// Static content — render once at build. cookies() returns empty under
// force-static, so the session-seeded background just falls back to a fixed
// pick; the header's auth state hydrates client-side.
export const dynamic = "force-static";

export default async function OmPage() {
  const [heroBg, parasolBg, harborBg] = await pickBgs(
    ["om-hero", "om-section", "om-stockholm"],
    HERO_POOL,
  );
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        {/* Hero */}
        <section className="relative">
          <div className="relative h-[58vh] md:h-[72vh] min-h-[420px] overflow-hidden">
            <Image
              src={heroBg}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/40 to-black/65" />
            <Container className="relative z-10 h-full flex flex-col justify-end pb-12 md:pb-20">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                About us
              </p>
              <h1 className="mt-4 font-heading text-[48px] md:text-[112px] leading-[0.9] uppercase tracking-[-0.02em] text-white">
                About Moidello
              </h1>
              <p className="mt-5 max-w-xl text-base md:text-lg text-white/80 leading-relaxed">
                A platform for discovering, sharing and being inspired by
                outfits — where style is easy to find and even easier to buy.
              </p>
            </Container>
          </div>
        </section>

        {/* Why we exist */}
        <Container className="max-w-3xl py-20 md:py-28">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-5">
            Why we exist
          </p>
          <h2 className="font-heading text-[36px] md:text-[56px] leading-[0.95] uppercase tracking-tight text-foreground mb-8">
            Style should be findable
          </h2>
          <div className="space-y-6 text-base md:text-lg text-foreground-muted leading-relaxed">
            <p>
              You see an outfit you love on Instagram. The cardigan is perfect.
              But what brand is it? Where do you buy it? You keep scrolling.
              The outfit is gone.
            </p>
            <p>That's what we wanted to change.</p>
            <p>
              On Moidello every piece is tagged and linked to where you can buy
              it. No guessing. No scroll frustration. Just style — and the way
              to it.
            </p>
          </div>
        </Container>

        {/* How it works */}
        <section className="relative">
          <div className="absolute inset-0">
            <Image
              src={parasolBg}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-background/85" />
          </div>
          <Container className="relative z-10 py-20 md:py-28">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-5">
              How it works
            </p>
            <h2 className="font-heading text-[36px] md:text-[56px] leading-[0.95] uppercase tracking-tight text-foreground mb-12 max-w-2xl">
              Four steps, no guesswork
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Step
                icon={Search}
                title="Discover"
                body="Browse outfits and filter by style, category or season."
              />
              <Step
                icon={Bookmark}
                title="Save"
                body="Bookmark whole outfits or single pieces. Build your own library of inspiration."
              />
              <Step
                icon={ShoppingBag}
                title="Buy"
                body="Click straight through to the store. We link — you shop where you want."
              />
              <Step
                icon={Users}
                title="Follow"
                body="Follow the profiles whose style matches yours and get their new outfits in your feed."
              />
            </div>
          </Container>
        </section>

        {/* For creators */}
        {OUTFIT_CREATE_PUBLIC && (
          <Container className="max-w-3xl py-20 md:py-28">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-5">
              For creators
            </p>
            <h2 className="font-heading text-[36px] md:text-[56px] leading-[0.95] uppercase tracking-tight text-foreground mb-8">
              A channel without an algorithm
            </h2>
            <div className="space-y-6 text-base md:text-lg text-foreground-muted leading-relaxed">
              <p>
                Are you a fashion content creator? Moidello is a new channel to
                reach followers — without an algorithm deciding who sees what.
                Tag your pieces, build your profile and get more eyes on your
                style.
              </p>
            </div>
            <div className="mt-10">
              <Link
                href="/skapa"
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-sm font-medium hover:bg-foreground/90 transition-transform active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Create your first outfit
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Container>
        )}

        {/* Made in Stockholm */}
        <section className="relative border-t border-border">
          <div className="absolute inset-0">
            <Image
              src={harborBg}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-background/80" />
          </div>
          <Container className="relative z-10 max-w-2xl py-20 md:py-24 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-5">
              Made in Stockholm
            </p>
            <h2 className="font-heading text-[32px] md:text-[44px] leading-[0.95] uppercase tracking-tight text-foreground mb-6">
              Small team, short decisions
            </h2>
            <p className="text-base text-foreground-muted leading-relaxed">
              Moidello is built in Sweden with a love of fashion, design and
              simple tools that actually work. We're a small team that moves
              fast and is glad to hear what you think.
            </p>
            <p className="mt-6 text-sm text-foreground-muted">
              Have ideas, feedback or want to partner with us?
            </p>
            <a
              href="mailto:hello@moidello.com"
              className="mt-3 inline-block text-base text-foreground border-b border-foreground/30 hover:border-foreground transition-colors"
            >
              hello@moidello.com
            </a>
          </Container>
        </section>
      </main>
    </>
  );
}

function Step({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Search;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.04] backdrop-blur-sm p-6 md:p-7 h-full">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background mb-5">
        <Icon className="h-4 w-4" strokeWidth={2.4} />
      </div>
      <h3 className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-3 text-sm text-foreground-muted leading-relaxed">
        {body}
      </p>
    </div>
  );
}
