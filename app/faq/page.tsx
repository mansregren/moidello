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
// fristående utan beroende av föregående fråga. Sektionerna grupperar
// frågor men FAQPage JSON-LD plattar dem i en lista — gruppsystemet är
// bara för läsbarhet i HTML.
type FaqGroup = {
  heading: string;
  items: { question: string; answer: string }[];
};

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "Om plattformen",
    items: [
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
          "Märken läggs till av kreatörer när de taggar plagg i sina outfits. Sortimentet spänner från svenska designermärken till etablerade internationella mode-företag inom hela prisspannet.",
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
      {
        question: "Vad är en Moidello-outfit-kod?",
        answer:
          "Varje publicerad outfit får en unik kortkod i formatet A271 (en bokstav följt av tre siffror). Koden visas på outfit-sidan och kan sökas via plattformens sökfält. Den används främst när någon refererar till en outfit på sociala medier.",
      },
    ],
  },
  {
    heading: "Stil och inspiration",
    items: [
      {
        question: "Vad är skandinavisk minimalism inom mode?",
        answer:
          "Skandinavisk minimalism kännetecknas av neutrala färgpaletter (beige, vit, svart, grå), rena silhuetter, naturmaterial som ull och linne, och plagg av hög kvalitet som är gjorda för att hålla flera säsonger. Stilen prioriterar passform och material framför mönster och accessoarer.",
      },
      {
        question: "Vad är smart casual?",
        answer:
          "Smart casual är en stil som balanserar formellt och avslappnat. Typiska plagg är chinos eller mörka jeans, en stickad tröja eller skjorta, och rena läderskor eller minimalistiska sneakers. Mer uppklätt än vardagligt, mindre formellt än kostym.",
      },
      {
        question: "Vad är en capsule wardrobe?",
        answer:
          "En capsule wardrobe är en garderob bestående av ett litet antal noggrant utvalda plagg — ofta 30–40 stycken — som kan kombineras till många olika outfits. Idén bygger på kvalitet före kvantitet och fokus på tidlösa snitt i en sammanhållen färgpalett.",
      },
      {
        question: "Hur stylar man baggy jeans?",
        answer:
          "Baggy jeans balanseras bäst med ett mer fitted ovandel — exempelvis en stickad tröja, en figursydd skjorta eller en t-shirt. Skor med lägre profil (sneakers, loafers eller boots utan klack) håller proportionerna. Bälte hjälper definiera midjan när jeansen sitter lågt.",
      },
      {
        question: "Vilka färger funkar i en grundgarderob?",
        answer:
          "En grundgarderob bygger oftast på neutrala basfärger som svart, vit, beige, grå och marinblå. Dessa låter plaggen kombineras fritt. Accent-färger som rött, kamel eller mörkgrönt läggs till för att skapa variation utan att splittra paletten.",
      },
      {
        question: "Vad är athleisure?",
        answer:
          "Athleisure är en stilkategori där träningsinspirerade plagg används utanför gymmet. Joggers, oversized hoodies, tekniska jackor och sneakers kombineras med vardagliga plagg för en avslappnad men medveten look. Materialen är ofta funktionella — fukt-transporterande, stretch eller termo.",
      },
    ],
  },
  {
    heading: "Säsong och tillfälle",
    items: [
      {
        question: "Vad bör man ha i en svensk höstgarderob?",
        answer:
          "En typisk svensk höstgarderob innehåller en trenchcoat eller läderjacka för regn, stickade plagg i ull eller mohair, läder- eller mocka-boots, mörkare jeans eller chinos, och en halsduk i tunnt ylle. Lagerprincipen är central eftersom temperaturen varierar.",
      },
      {
        question: "Hur klär man sig till en sommar-bröllop?",
        answer:
          "Till ett sommar-bröllop bär man traditionellt en lätt klänning i naturmaterial (linne, bomull, viskos) för damer och en ljusare kostym eller chinos med skjorta för herrar. Stark färg går bra, men undvik vitt om paret bär det. Skorna ska vara bekväma — en stor del av tiden står man.",
      },
      {
        question: "Vad är en bra kontorsoutfit för dam?",
        answer:
          "En klassisk kontorsoutfit för dam bygger på en blazer eller stickad cardigan, en blus eller fin t-shirt, byxor eller en mid-rise kjol, och loafers eller låga boots. Färgpaletten är neutral med max en accent-färg. Smycken hålls minimala.",
      },
      {
        question: "Vad är en bra kontorsoutfit för herr?",
        answer:
          "En klassisk smart casual-kontorsoutfit för herr består av chinos eller mörka jeans, en skjorta eller poloskjorta, en stickad tröja vid behov, och läderskor — loafers, derbys eller minimalistiska sneakers. Färgerna är dämpade. Klocka som enda accessoar.",
      },
    ],
  },
  {
    heading: "Köp och passform",
    items: [
      {
        question: "Hur väljer man rätt storlek när man handlar online?",
        answer:
          "Mät dina egna mått (bröst, midja, höft, längd) och jämför med produktens storleksguide istället för att lita på den vanliga storleken. Olika märken har olika passform och storlekarna varierar. Återförsäljarens egna måttabeller är mer pålitliga än standardiserade storlekar.",
      },
      {
        question: "Vilka mode-material är mest hållbara?",
        answer:
          "Material med längst livslängd är ull, linne, denim av hög kvalitet, läder och kashmir. De håller form, åldras snyggt och tål många tvättar. Syntetiska blandningar som polyester och elastan håller färgen längre men förlorar form snabbare och bryts ned i miljön.",
      },
      {
        question: "Hur tvättar man stickade plagg?",
        answer:
          "Stickade plagg i ull eller kashmir tvättas i ulltvätt-program på max 30°C eller för hand i ljummet vatten med ulltvättmedel. Centrifugera lågt, pressa ut vatten i en handduk istället för att vrida, och torka platt på en plan yta. Häng inte upp — det drar ut formen.",
      },
      {
        question: "Vad är skillnaden mellan affiliate-länk och vanlig länk?",
        answer:
          "En affiliate-länk innehåller en spårningskod som gör att kreatören som delar länken får en provision om någon klickar och handlar. För dig som köper är priset detsamma — provisionen tas från återförsäljarens marginal. Affiliate-länkar måste enligt svensk lag märkas tydligt som reklam.",
      },
    ],
  },
];

const FAQ = FAQ_GROUPS.flatMap((g) => g.items);

export const dynamic = "force-static";

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

          {FAQ_GROUPS.map((group) => (
            <section key={group.heading} className="mb-16 last:mb-0">
              <h2 className="text-xs uppercase tracking-[0.25em] text-foreground-subtle mb-6">
                {group.heading}
              </h2>
              <dl className="space-y-10">
                {group.items.map(({ question, answer }) => (
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
            </section>
          ))}

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
