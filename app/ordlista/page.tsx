import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { definedTermSetJsonLd } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "Fashion glossary",
  description:
    "A glossary of fashion terms: capsule wardrobe, Scandinavian minimalism, smart casual, athleisure, streetwear, layering and more concepts explained.",
  alternates: { canonical: "/ordlista" },
};

// The definitions are written as standalone answers — AI search engines
// (ChatGPT, Perplexity, Claude) extract definitions from DefinedTermSet
// schema and favour pages with one term per row, a full sentence and no
// sales context.
const TERMS: { term: string; description: string }[] = [
  {
    term: "Capsule wardrobe",
    description:
      "A core wardrobe of a limited number of carefully chosen pieces, typically 30–40, selected so that they all combine with each other. Built on a cohesive colour palette and a focus on quality over quantity.",
  },
  {
    term: "Scandinavian minimalism",
    description:
      "A fashion style rooted in Sweden, Denmark and Norway. Defined by neutral colour palettes (black, white, beige, grey, navy), clean silhouettes, natural materials such as wool and linen, and high-quality pieces built to last several seasons.",
  },
  {
    term: "Smart casual",
    description:
      "A dress code that balances formal and relaxed. Typical pieces are chinos or dark jeans, a shirt or fine knit, and clean leather shoes or minimalist sneakers. Less formal than a suit, dressier than everyday wear.",
  },
  {
    term: "Athleisure",
    description:
      "A style category where sport-inspired pieces are worn outside the gym. Joggers, oversized hoodies, technical jackets and sneakers are combined with everyday pieces. The materials are functional — moisture-wicking, stretch or thermal.",
  },
  {
    term: "Streetwear",
    description:
      "A fashion style that grew out of skate, surf and hip-hop culture in the United States. Characterised by oversized fits, graphic prints, sneakers and statement pieces. Influences also come from Japanese street fashion and the British grime scene.",
  },
  {
    term: "Preppy",
    description:
      "A style rooted in New England prep schools. Classic elements are polo shirts, knits, chinos, loafers, oxford shirts and cable-knit sweaters. The colour palette is often nautical: navy, white, red, beige.",
  },
  {
    term: "Layering",
    description:
      "The technique of combining several thinner pieces on top of each other instead of one thick piece. Gives temperature control, more texture in the outfit and flexibility when the temperature swings — relevant for a Nordic climate all year round.",
  },
  {
    term: "Affiliate link",
    description:
      "A web link with an embedded tracking code that identifies who shared it. When someone buys through the link, the sharer receives a commission from the retailer. The price for the buyer is unaffected. Must be clearly marked as advertising.",
  },
  {
    term: "Flatlay",
    description:
      "A photo style where pieces are laid flat on a surface and photographed from above, instead of being worn by a model. Used to show individual pieces or whole outfits where every detail should be clearly visible.",
  },
  {
    term: "Slow fashion",
    description:
      "A movement as a counterweight to fast fashion. It means buying fewer but more durable pieces, focusing on material and craftsmanship, longer wear and often second hand. Built on the idea that a wardrobe should grow slowly and be repaired rather than replaced.",
  },
  {
    term: "Fast fashion",
    description:
      "A fashion production model where collections are released at a high pace — sometimes every week — at low prices. The pieces are typically designed for a shorter lifespan. The model is criticised for its environmental impact and working conditions in the supply chain.",
  },
  {
    term: "Oversized fit",
    description:
      "A fit where the piece is deliberately larger than the wearer's normal size. Gives volume to the silhouette without looking ill-fitting, provided the proportions in the rest of the outfit compensate.",
  },
  {
    term: "Mid-rise",
    description:
      "A waist height on trousers or skirts that sits between the hip and the navel. The middle ground between low-rise (below the hip) and high-rise (at or above the navel). The most common rise in modern jeans.",
  },
  {
    term: "Capsule collection",
    description:
      "A smaller themed collection from a brand, often limited in time or quantity. It differs from the main collection by being more focused — for example a collaboration collection or a seasonal special.",
  },
  {
    term: "Ad disclosure",
    description:
      "A label required by marketing law when someone publishes content for compensation, including content with affiliate links. It must be clear, legible and placed close to the paid content.",
  },
];

export const dynamic = "force-static";

export default function OrdlistaPage() {
  return (
    <>
      <JsonLd data={definedTermSetJsonLd(TERMS)} />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1">
        <Container className="py-16 md:py-24 max-w-3xl">
          <div className="border-b border-border pb-10 mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground-subtle mb-4">
              Glossary
            </p>
            <h1 className="font-heading text-5xl md:text-7xl uppercase tracking-tight leading-none">
              Fashion glossary
            </h1>
            <p className="mt-6 text-lg text-foreground-muted max-w-2xl">
              Explanations of recurring concepts in fashion — from capsule
              wardrobe to Scandinavian minimalism.
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
