import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";

export default function IntegritetPage() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        <Container className="py-16 md:py-24 max-w-3xl">
          <div className="border-b border-border pb-10 mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-4">
              Juridik
            </p>
            <h1 className="font-heading text-5xl md:text-7xl uppercase tracking-tight leading-none">
              Integritetspolicy
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
                Moidello värnar om din integritet. Denna policy beskriver hur vi
                samlar in, använder och skyddar information i samband med din
                användning av tjänsten, i enlighet med
                Dataskyddsförordningen (GDPR).
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                2. Personuppgiftsansvarig
              </h2>
              <p>
                Moidello är personuppgiftsansvarig för behandlingen av
                personuppgifter inom tjänsten. Frågor om behandlingen kan
                ställas till{" "}
                <a
                  href="mailto:hello@moidello.com"
                  className="text-white border-b border-white/30 hover:border-white transition-colors"
                >
                  hello@moidello.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                3. Vilka uppgifter vi samlar in
              </h2>
              <p>
                Moidello är för närvarande i en publik förhandsversion utan
                kontoskapande. Vi samlar in begränsad information:
              </p>
              <ul className="mt-4 space-y-2 list-disc list-outside pl-6">
                <li>
                  <strong className="text-white font-medium">Anonym besöksstatistik</strong>
                  {" "}via Vercel Web Analytics — utan cookies, utan IP-adress
                  som identifierar enskild person.
                </li>
                <li>
                  <strong className="text-white font-medium">Lokala inställningar</strong>
                  {" "}(t.ex. valt kön-filter) sparas i din webbläsare via
                  localStorage. Dessa data lämnar aldrig din enhet.
                </li>
              </ul>
              <p className="mt-4">
                När kontoskapande och inloggning aktiveras kommer vi att samla
                in e-postadress, användarnamn och innehåll du publicerar. Denna
                policy uppdateras i samband med det.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                4. Hur vi använder uppgifterna
              </h2>
              <p>
                Anonym statistik används för att förstå hur tjänsten används
                och för att förbättra upplevelsen. Lokala inställningar används
                för att personalisera ditt flöde. Vi säljer aldrig data till
                tredje part.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                5. Tredjepartstjänster
              </h2>
              <p>
                Tjänsten driftas på Vercel. Anonym besöksstatistik tillhandahålls
                av Vercel Web Analytics. När du klickar på affiliate-länkar
                publicerade av andra användare lämnar du Moidello och omfattas
                av den länkade webbplatsens villkor och integritetspolicy.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                6. Cookies
              </h2>
              <p>
                Moidello använder inga marknadsförings- eller spårningscookies.
                Vi använder endast tekniskt nödvändig lagring (localStorage)
                för att komma ihåg dina inställningar mellan besök. Eftersom
                ingen tredjepartsspårning används krävs ingen cookie-banner.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                7. Dina rättigheter
              </h2>
              <p>
                Enligt GDPR har du rätt att begära information om vilka
                personuppgifter vi behandlar om dig, samt att begära rättelse,
                radering, begränsning eller dataportabilitet. Du har även rätt
                att invända mot behandling och lämna klagomål till
                Integritetsskyddsmyndigheten (IMY).
              </p>
              <p className="mt-4">
                Förfrågningar skickas till{" "}
                <a
                  href="mailto:hello@moidello.com"
                  className="text-white border-b border-white/30 hover:border-white transition-colors"
                >
                  hello@moidello.com
                </a>
                . Vi besvarar inom 30 dagar.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                8. Säkerhet
              </h2>
              <p>
                Vi vidtar tekniska och organisatoriska åtgärder för att skydda
                de uppgifter vi behandlar mot obehörig åtkomst, förlust och
                förvanskning.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl uppercase tracking-tight text-white mb-4">
                9. Ändringar
              </h2>
              <p>
                Denna policy kan uppdateras. Datum för senaste uppdatering visas
                ovan.
              </p>
            </section>
          </div>

          <div className="mt-20 pt-10 border-t border-border">
            <Link
              href="/villkor"
              className="text-sm text-foreground-muted hover:text-white transition-colors"
            >
              Läs även Användarvillkoren →
            </Link>
          </div>
        </Container>
      </main>
    </>
  );
}
