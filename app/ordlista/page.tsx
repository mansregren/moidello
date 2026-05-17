import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { definedTermSetJsonLd } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "Mode-ordlista",
  description:
    "Ordlista över mode-termer: capsule wardrobe, skandinavisk minimalism, smart casual, athleisure, streetwear, layering och fler begrepp förklarade på svenska.",
  alternates: { canonical: "/ordlista" },
};

// Definitionerna är skrivna som fristående svar — AI-sökmotorer
// (ChatGPT, Perplexity, Claude) extraherar definitioner från
// DefinedTermSet-schema och prioriterar sidor med ett fackbegrepp per
// rad, full mening och ingen säljkontext.
const TERMS: { term: string; description: string }[] = [
  {
    term: "Capsule wardrobe",
    description:
      "En kärngarderob bestående av ett begränsat antal noggrant utvalda plagg, typiskt 30–40 stycken, valda så att alla går att kombinera med varandra. Bygger på en sammanhållen färgpalett och fokus på kvalitet före kvantitet.",
  },
  {
    term: "Skandinavisk minimalism",
    description:
      "Modestil med rötter i Sverige, Danmark och Norge. Kännetecknas av neutrala färgpaletter (svart, vit, beige, grå, marinblå), rena silhuetter, naturmaterial som ull och linne, och plagg av hög kvalitet avsedda att hålla flera säsonger.",
  },
  {
    term: "Smart casual",
    description:
      "Dresscode som balanserar mellan formellt och avslappnat. Typiska plagg är chinos eller mörka jeans, skjorta eller fin stickad tröja, samt rena läderskor eller minimalistiska sneakers. Mindre formellt än kostym, mer uppklätt än vardagligt.",
  },
  {
    term: "Athleisure",
    description:
      "Stilkategori där träningsinspirerade plagg används utanför gymmet. Joggers, oversize hoodies, tekniska jackor och sneakers kombineras med vardagliga plagg. Materialen är funktionella — fukt-transporterande, stretch eller termo.",
  },
  {
    term: "Streetwear",
    description:
      "Modestil som uppstod ur skate-, surf- och hiphop-kulturen i USA. Karaktäriseras av oversize-fit, grafiska tryck, sneakers och statement-plagg. Influenser kommer också från japansk gatumode och brittisk grime-scen.",
  },
  {
    term: "Preppy",
    description:
      "Stil med rötter i New Englands privatskolor. Klassiska element är poloskjortor, stickade tröjor, chinos, loafers, oxfordskjortor och paneer-tröjor. Färgpaletten är ofta nautisk: marinblå, vit, röd, beige.",
  },
  {
    term: "Layering",
    description:
      "Tekniken att kombinera flera tunnare plagg ovanpå varandra istället för ett tjockt plagg. Ger temperaturreglering, mer textur i outfiten och flexibilitet vid svängande temperatur — relevant för svenskt klimat året om.",
  },
  {
    term: "Affiliate-länk",
    description:
      "Webblänk med inbäddad spårningskod som identifierar vem som delat länken. När någon köper via länken får delaren en provision från återförsäljaren. Pris för köparen påverkas inte. Måste enligt svensk lag märkas tydligt som reklam.",
  },
  {
    term: "Flatlay",
    description:
      "Fotostil där plaggen läggs ut platt på en yta och fotograferas uppifrån, istället för att bäras av en modell. Används för att visa enskilda plagg eller hela outfits där varje detalj ska synas tydligt.",
  },
  {
    term: "Slow fashion",
    description:
      "Rörelse som motvikt till fast fashion. Innebär köp av färre men hållbarare plagg, fokus på material och hantverk, längre brukstid och ofta second hand. Bygger på att en garderob ska växa långsamt och repareras snarare än bytas ut.",
  },
  {
    term: "Fast fashion",
    description:
      "Modeproduktionsmodell där kollektioner släpps i hög takt — ibland varje vecka — till låga priser. Plaggen är typiskt designade för kortare brukstid. Modellen kritiseras för miljöpåverkan och arbetsvillkor i produktionsledet.",
  },
  {
    term: "Oversized fit",
    description:
      "Passform där plagget är medvetet större än bärarens normala storlek. Ger volym i silhuetten utan att se illa-anpassat ut, förutsatt att proportionerna i resten av outfiten kompenserar.",
  },
  {
    term: "Mid-rise",
    description:
      "Midjehöjd på byxor eller kjolar som sitter mellan höften och naveln. Mellanlägret mellan low-rise (under höften) och high-rise (vid eller över naveln). Den vanligaste höjden i moderna jeans.",
  },
  {
    term: "Capsule collection",
    description:
      "Mindre tematisk kollektion från ett märke, ofta begränsad i tid eller antal. Skiljer sig från huvudkollektionen genom att vara mer fokuserad — exempelvis en samarbetskollektion eller en säsongs-special.",
  },
  {
    term: "Reklam-markering",
    description:
      "Märkning som krävs enligt svensk Marknadsföringslag när någon publicerar innehåll mot ersättning, inklusive innehåll med affiliate-länkar. Måste vara tydlig, läsbar och placerad nära det betalda innehållet.",
  },
];

export default function OrdlistaPage() {
  return (
    <>
      <JsonLd data={definedTermSetJsonLd(TERMS)} />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        <Container className="py-16 md:py-24 max-w-3xl">
          <div className="border-b border-border pb-10 mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-4">
              Ordlista
            </p>
            <h1 className="font-heading text-5xl md:text-7xl uppercase tracking-tight leading-none">
              Mode-ordlista
            </h1>
            <p className="mt-6 text-lg text-foreground-muted max-w-2xl">
              Förklaringar av återkommande begrepp inom mode — från
              capsule wardrobe till skandinavisk minimalism.
            </p>
          </div>

          <dl className="space-y-10">
            {TERMS.map(({ term, description }) => (
              <div key={term}>
                <dt
                  id={term.toLowerCase().replace(/\s+/g, "-")}
                  className="font-heading text-xl md:text-2xl uppercase tracking-tight text-foreground mb-3"
                >
                  {term}
                </dt>
                <dd className="text-foreground-muted leading-relaxed">
                  {description}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </main>
    </>
  );
}
