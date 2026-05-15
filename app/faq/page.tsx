import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageJsonLd } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "Vanliga frågor",
  description:
    "Vanliga frågor om Moidello — vad plattformen är, hur den fungerar, hur kreatörer tjänar pengar, hur märken kan vara med och hur intrång anmäls.",
  alternates: { canonical: "/faq" },
};

// Korta, faktiska svar — skrivna för att kunna citeras direkt av
// AI-sökmotorer (ChatGPT, Perplexity, Claude). Varje svar ska stå
// fristående utan beroende av föregående fråga.
const FAQ: { question: string; answer: string }[] = [
  {
    question: "Vad är Moidello?",
    answer:
      "Moidello är en svensk plattform för outfit-inspiration. Användare publicerar bilder på outfits, taggar varje plagg med märke och köplänk, och andra kan klicka för att hitta och köpa plaggen från ursprungsbutiken.",
  },
  {
    question: "Hur fungerar Moidello?",
    answer:
      "Du bläddrar i outfits från olika kreatörer och kan klicka på taggade plagg för att se märke, namn, pris och köplänk. Köplänkarna går direkt till märkets egen butik. Med ett konto kan du publicera egna outfits, följa kreatörer och spara plagg.",
  },
  {
    question: "Är Moidello gratis?",
    answer:
      "Ja. Det är kostnadsfritt att skapa konto, bläddra och publicera outfits. Det finns inga premium-abonnemang.",
  },
  {
    question: "Hur tjänar kreatörer pengar på Moidello?",
    answer:
      "Kreatörer använder sina egna affiliate-länkar när de taggar plagg. Eventuell kommission går direkt till kreatören — Moidello tar ingen del av intäkterna.",
  },
  {
    question: "Hur tjänar Moidello pengar?",
    answer:
      "Moidello tar ingen del av kreatörers affiliate-intäkter. Plattformen är i ett tidigt skede och fokuserar på att bygga användarbas och partnerskap med märken före intäktsmodell.",
  },
  {
    question: "Är Moidello bara för svenska användare?",
    answer:
      "Innehållet är på svenska och de flesta märken är europeiska, men sajten är öppen för besökare och kreatörer från alla länder.",
  },
  {
    question: "Vilka märken finns på Moidello?",
    answer:
      "Märken läggs till av kreatörer när de taggar plagg i sina outfits. Bland nuvarande märken finns Djerf Avenue, Nelly, NA-KD, Aimé Leon Dore samt flera mindre svenska och internationella märken.",
  },
  {
    question: "Kan ett märke skapa en egen profil?",
    answer:
      "Ja. Märken kan registrera ett företagskonto på Moidello, ladda upp egna inlägg och länka till sin produktkatalog. Det är kostnadsfritt. Kontakta hello@moidello.com för att komma igång.",
  },
  {
    question: "Är affiliate-länkar märkta som reklam?",
    answer:
      "Ja. Plagg som taggats med en affiliate-länk visas med en REKLAM-markering i enlighet med Marknadsföringslagen och Konsumentverkets riktlinjer.",
  },
  {
    question: "Hur rapporterar man upphovsrättsintrång?",
    answer:
      "Mejla hello@moidello.com med en länk till innehållet som anses göra intrång och en beskrivning av rättigheten. Anmälningar granskas normalt inom fem arbetsdagar.",
  },
];

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd(FAQ)} />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        <Container className="py-16 md:py-24 max-w-3xl">
          <div className="border-b border-border pb-10 mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-4">
              Vanliga frågor
            </p>
            <h1 className="font-heading text-5xl md:text-7xl uppercase tracking-tight leading-none">
              FAQ
            </h1>
          </div>

          <dl className="space-y-10">
            {FAQ.map(({ question, answer }) => (
              <div key={question}>
                <dt className="font-heading text-xl md:text-2xl uppercase tracking-tight text-foreground mb-3">
                  {question}
                </dt>
                <dd className="text-foreground-muted leading-relaxed">
                  {answer}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-20 pt-10 border-t border-border">
            <p className="text-sm text-foreground-muted">
              Har du en fråga som inte besvaras här?{" "}
              <a
                href="mailto:hello@moidello.com"
                className="text-foreground border-b border-foreground/30 hover:border-foreground transition-colors"
              >
                hello@moidello.com
              </a>
            </p>
          </div>
        </Container>
      </main>
    </>
  );
}
