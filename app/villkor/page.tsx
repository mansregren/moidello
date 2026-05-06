import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";

export default function VillkorPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Container className="py-16 md:py-24 max-w-3xl">
          <div className="border-b border-border pb-10 mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-4">
              Juridik
            </p>
            <h1 className="font-heading text-5xl md:text-7xl uppercase tracking-tight leading-none">
              Användarvillkor
            </h1>
            <p className="mt-6 text-sm text-foreground-muted">
              Senast uppdaterad 6 maj 2026
            </p>
          </div>

          <div className="space-y-12 text-foreground-muted leading-relaxed">
            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                1. Inledning
              </h2>
              <p>
                Dessa villkor (&quot;Villkoren&quot;) reglerar din användning av Moidello,
                en plattform för att upptäcka, dela och inspireras av outfits.
                Genom att använda tjänsten godkänner du Villkoren i sin helhet.
                Om du inte accepterar dem ska du inte använda tjänsten.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                2. Tjänsten
              </h2>
              <p>
                Moidello är en social plattform där användare publicerar bilder
                på outfits, taggar plagg och länkar till var dessa kan köpas.
                Tjänsten tillhandahålls i befintligt skick. Funktioner kan
                ändras, läggas till eller tas bort utan föregående varsel.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                3. Användarkonton
              </h2>
              <p>
                Vissa funktioner kräver ett användarkonto. Du ansvarar för att
                inloggningsuppgifter hålls säkra och att den information du
                anger är korrekt. Du får inte överlåta ditt konto till någon
                annan.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                4. Användargenererat innehåll
              </h2>
              <p>
                Du behåller äganderätten till det innehåll du publicerar, men
                ger Moidello en icke-exklusiv, royaltyfri, världsomspännande
                licens att lagra, visa och distribuera innehållet inom tjänsten
                och för marknadsföring av denna.
              </p>
              <p className="mt-4">
                Du intygar att du har rätt till allt innehåll du publicerar,
                inklusive bilder, varumärken och länkar, och att innehållet
                inte gör intrång i tredje parts rättigheter.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                5. Affiliate-länkar och marknadsföring
              </h2>
              <p>
                Innehåll som innehåller affiliate-länkar eller annan
                kommersiell ersättning ska tydligt märkas som reklam i enlighet
                med Marknadsföringslagen och Konsumentverkets riktlinjer. Det
                är ditt ansvar som användare att säkerställa korrekt
                annonsmärkning.
              </p>
              <p className="mt-4">
                Moidello är inte part i några avtal mellan användare,
                affiliate-nätverk eller varumärken, och har inget ansvar för
                ersättning som genereras genom användares länkar.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                6. Otillåtet innehåll
              </h2>
              <p>
                Det är inte tillåtet att publicera innehåll som:
              </p>
              <ul className="mt-4 space-y-2 list-disc list-outside pl-6">
                <li>är olagligt, vilseledande eller kränkande</li>
                <li>gör intrång i upphovsrätt eller varumärken</li>
                <li>marknadsför kopior, förfalskningar eller plagiat</li>
                <li>länkar till skadlig kod, bedrägerier eller olagliga produkter</li>
                <li>strider mot god marknadsföringssed</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                7. Moderation
              </h2>
              <p>
                Moidello förbehåller sig rätten att ta bort innehåll, begränsa
                eller stänga av konton som bryter mot Villkoren, utan
                ersättningsskyldighet. Innehåll som rapporteras granskas inom
                rimlig tid.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                8. Immateriella rättigheter
              </h2>
              <p>
                Moidello, logotyp, varumärken och plattformens design tillhör
                Moidello. Inget i Villkoren överför några rättigheter till dig
                utöver rätten att använda tjänsten enligt dessa villkor.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                9. Ansvarsbegränsning
              </h2>
              <p>
                Tjänsten tillhandahålls i befintligt skick utan garantier av
                något slag. Moidello ansvarar inte för indirekta skador,
                förlorad inkomst eller skador som uppstår till följd av
                avbrott, fel eller förlust av data, i den utsträckning lagen
                tillåter.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                10. Ändringar
              </h2>
              <p>
                Villkoren kan uppdateras. Vid väsentliga ändringar informeras
                aktiva användare. Fortsatt användning efter ändringar innebär
                att du accepterar de nya villkoren.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                11. Tillämplig lag
              </h2>
              <p>
                Svensk lag tillämpas på Villkoren. Tvister avgörs av svensk
                domstol med Stockholms tingsrätt som första instans.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                12. Kontakt
              </h2>
              <p>
                Frågor om Villkoren skickas till{" "}
                <a
                  href="mailto:hello@moidello.com"
                  className="text-white border-b border-white/30 hover:border-white transition-colors"
                >
                  hello@moidello.com
                </a>
                .
              </p>
            </section>
          </div>

          <div className="mt-20 pt-10 border-t border-border">
            <Link
              href="/integritet"
              className="text-sm text-foreground-muted hover:text-white transition-colors"
            >
              Läs även Integritetspolicyn →
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
