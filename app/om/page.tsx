import Image from "next/image";
import Link from "next/link";
import { Search, Bookmark, ShoppingBag, Plus, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { pickBgs, HERO_POOL } from "@/lib/session-background";

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
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-background" />
            <Container className="relative z-10 h-full flex flex-col justify-end pb-12 md:pb-20">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                Om oss
              </p>
              <h1 className="mt-4 font-heading text-[48px] md:text-[112px] leading-[0.9] uppercase tracking-[-0.02em] text-white">
                Om Moidello
              </h1>
              <p className="mt-5 max-w-xl text-base md:text-lg text-white/80 leading-relaxed">
                Inspiration för varje outfit. En plattform för att upptäcka,
                dela och inspireras av outfits — där stil är enkelt att hitta
                och ännu enklare att köpa.
              </p>
            </Container>
          </div>
        </section>

        {/* Varför vi finns */}
        <Container className="max-w-3xl py-20 md:py-28">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-5">
            Varför vi finns
          </p>
          <h2 className="font-heading text-[36px] md:text-[56px] leading-[0.95] uppercase tracking-tight text-white mb-8">
            Stil ska gå att hitta
          </h2>
          <div className="space-y-6 text-base md:text-lg text-foreground-muted leading-relaxed">
            <p>
              Du ser en outfit du älskar på Instagram. Cardiganen är perfekt.
              Men vad är det för märke? Var köper du den? Du scrollar vidare.
              Outfiten försvinner.
            </p>
            <p>Det här ville vi ändra på.</p>
            <p>
              På Moidello taggar varje kreatör sina plagg och länkar dit du
              kan köpa dem. Inga gissningar. Ingen scroll-frustration. Bara
              stil — och vägen dit.
            </p>
          </div>
        </Container>

        {/* Hur det funkar */}
        <section className="relative">
          <div className="absolute inset-0">
            <Image
              src={parasolBg}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/85" />
          </div>
          <Container className="relative z-10 py-20 md:py-28">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-5">
              Så funkar det
            </p>
            <h2 className="font-heading text-[36px] md:text-[56px] leading-[0.95] uppercase tracking-tight text-white mb-12 max-w-2xl">
              Fyra steg, ingen gissningslek
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Step
                icon={Search}
                title="Upptäck"
                body="Bläddra bland outfits från svenska kreatörer. Filtrera på stil, kategori eller säsong."
              />
              <Step
                icon={Bookmark}
                title="Spara"
                body="Bokmärk hela outfits eller enskilda plagg. Bygg ditt eget bibliotek av inspiration."
              />
              <Step
                icon={ShoppingBag}
                title="Köp"
                body="Klicka dig direkt vidare till butiken. Vi länkar — du handlar där du vill."
              />
              <Step
                icon={Plus}
                title="Skapa"
                body="Ladda upp dina egna outfits, tagga plaggen, och inspirera andra. Det är gratis."
              />
            </div>
          </Container>
        </section>

        {/* För kreatörer */}
        <Container className="max-w-3xl py-20 md:py-28">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-5">
            För kreatörer
          </p>
          <h2 className="font-heading text-[36px] md:text-[56px] leading-[0.95] uppercase tracking-tight text-white mb-8">
            En kanal utan algoritm
          </h2>
          <div className="space-y-6 text-base md:text-lg text-foreground-muted leading-relaxed">
            <p>
              Är du contentskapare inom mode? Moidello är en ny kanal att nå
              följare på — utan algoritmer som bestämmer vem som ser vad.
              Tagga dina plagg, bygg din profil och få fler ögon på din stil.
            </p>
          </div>
          <div className="mt-10">
            <Link
              href="/skapa"
              className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-medium hover:bg-white/90 transition-transform active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Skapa din första outfit
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>

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
            <div className="absolute inset-0 bg-black/80" />
          </div>
          <Container className="relative z-10 max-w-2xl py-20 md:py-24 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-5">
              Made in Stockholm
            </p>
            <h2 className="font-heading text-[32px] md:text-[44px] leading-[0.95] uppercase tracking-tight text-white mb-6">
              Litet team, korta beslutsvägar
            </h2>
            <p className="text-base text-foreground-muted leading-relaxed">
              Moidello byggs från Sverige med kärlek till mode, design och
              enkla verktyg som faktiskt fungerar. Vi är ett litet team som
              rör oss snabbt och lyssnar gärna på vad du tycker.
            </p>
            <p className="mt-6 text-sm text-foreground-muted">
              Har du idéer, feedback eller vill samarbeta?
            </p>
            <a
              href="mailto:hello@moidello.com"
              className="mt-3 inline-block text-base text-white border-b border-white/30 hover:border-white transition-colors"
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 md:p-7 h-full">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black mb-5">
        <Icon className="h-4 w-4" strokeWidth={2.4} />
      </div>
      <h3 className="font-heading text-2xl md:text-3xl uppercase tracking-tight text-white">
        {title}
      </h3>
      <p className="mt-3 text-sm text-foreground-muted leading-relaxed">
        {body}
      </p>
    </div>
  );
}
