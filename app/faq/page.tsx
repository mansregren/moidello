import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageJsonLd } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Frequently asked questions about Moidello — what the platform is, how it works, how brands can take part and how infringement is reported.",
  alternates: { canonical: "/faq" },
};

// Short, factual answers — written so they can be quoted directly by AI
// search engines (ChatGPT, Perplexity, Claude). Each answer must stand on
// its own without depending on the previous question. The sections group
// questions, but the FAQPage JSON-LD flattens them into one list — the
// grouping is only for readability in the HTML.
type FaqGroup = {
  heading: string;
  items: { question: string; answer: string }[];
};

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: "About the platform",
    items: [
      {
        question: "What is Moidello?",
        answer:
          "Moidello is a platform for outfit inspiration. Outfits are published as images, every piece is tagged with its brand and a link, and anyone can click through to find and buy the pieces from the original store.",
      },
      {
        question: "How does Moidello work?",
        answer:
          "You browse outfits and can click any tagged piece to see the brand, name, price and a link to buy it. The links go straight to the brand's own store. With an account you can save pieces and follow outfits you like.",
      },
      {
        question: "Is Moidello free?",
        answer:
          "Yes. Creating an account and browsing are free. There are no premium subscriptions.",
      },
      {
        question: "How does Moidello make money?",
        answer:
          "Moidello is at an early stage and is focused on building an audience and brand partnerships before a revenue model.",
      },
      {
        question: "Is Moidello only for Swedish users?",
        answer:
          "The site is in English and most brands are European, but it is open to visitors from any country.",
      },
      {
        question: "Which brands are on Moidello?",
        answer:
          "The range spans Scandinavian designer labels to established international fashion houses across the full price spectrum.",
      },
      {
        question: "Can a brand create its own profile?",
        answer:
          "Yes. Brands can register a company account on Moidello, upload their own posts and link to their product catalogue. It is free. Contact hello@moidello.com to get started.",
      },
      {
        question: "Are affiliate links marked as advertising?",
        answer:
          "Yes. A piece tagged with an affiliate link is shown with an AD marker, in line with marketing law and consumer-protection guidance.",
      },
      {
        question: "How do I report copyright infringement?",
        answer:
          "Email hello@moidello.com with a link to the content you believe infringes and a description of the right. Reports are normally reviewed within five business days.",
      },
      {
        question: "What is a Moidello outfit code?",
        answer:
          "Every published outfit gets a unique short code in the format A271 (one letter followed by three digits). The code is shown on the outfit page and can be searched from the platform's search field. It is mainly used when someone refers to an outfit on social media.",
      },
    ],
  },
  {
    heading: "Style and inspiration",
    items: [
      {
        question: "What is Scandinavian minimalism in fashion?",
        answer:
          "Scandinavian minimalism is defined by neutral colour palettes (beige, white, black, grey), clean silhouettes, natural materials such as wool and linen, and high-quality pieces built to last several seasons. The style prioritises fit and fabric over pattern and accessories.",
      },
      {
        question: "What is smart casual?",
        answer:
          "Smart casual is a style that balances formal and relaxed. Typical pieces are chinos or dark jeans, a knit or a shirt, and clean leather shoes or minimalist sneakers. Dressier than everyday wear, less formal than a suit.",
      },
      {
        question: "What is a capsule wardrobe?",
        answer:
          "A capsule wardrobe is a wardrobe of a small number of carefully chosen pieces — often 30–40 — that combine into many different outfits. The idea rests on quality over quantity and a focus on timeless cuts in a cohesive colour palette.",
      },
      {
        question: "How do you style baggy jeans?",
        answer:
          "Baggy jeans are balanced best with a more fitted top — a knit, a tailored shirt or a t-shirt. Lower-profile shoes (sneakers, loafers or flat boots) keep the proportions. A belt helps define the waist when the jeans sit low.",
      },
      {
        question: "Which colours work in a core wardrobe?",
        answer:
          "A core wardrobe usually builds on neutral base colours such as black, white, beige, grey and navy. These let pieces combine freely. Accent colours such as red, camel or dark green are added for variety without breaking up the palette.",
      },
      {
        question: "What is athleisure?",
        answer:
          "Athleisure is a style category where sport-inspired pieces are worn outside the gym. Joggers, oversized hoodies, technical jackets and sneakers are combined with everyday pieces for a relaxed but considered look. The materials are often functional — moisture-wicking, stretch or thermal.",
      },
    ],
  },
  {
    heading: "Season and occasion",
    items: [
      {
        question: "What belongs in a Nordic autumn wardrobe?",
        answer:
          "A typical Nordic autumn wardrobe holds a trench coat or leather jacket for rain, knits in wool or mohair, leather or suede boots, darker jeans or chinos, and a fine wool scarf. Layering is central because the temperature varies.",
      },
      {
        question: "How do you dress for a summer wedding?",
        answer:
          "For a summer wedding you traditionally wear a light dress in a natural fabric (linen, cotton, viscose), or a lighter suit or chinos with a shirt. Strong colour is fine, but avoid white if the couple is wearing it. Shoes should be comfortable — you spend a lot of the time standing.",
      },
      {
        question: "What is a good office outfit for women?",
        answer:
          "A classic office outfit for women builds on a blazer or a knit cardigan, a blouse or fine t-shirt, trousers or a mid-rise skirt, and loafers or low boots. The palette is neutral with at most one accent colour. Jewellery is kept minimal.",
      },
      {
        question: "What is a good office outfit for men?",
        answer:
          "A classic smart-casual office outfit for men is chinos or dark jeans, a shirt or polo, a knit if needed, and leather shoes — loafers, derbies or minimalist sneakers. The colours are muted. A watch as the only accessory.",
      },
    ],
  },
  {
    heading: "Buying and fit",
    items: [
      {
        question: "How do you pick the right size when shopping online?",
        answer:
          "Measure yourself (chest, waist, hip, length) and compare against the product's size guide instead of trusting your usual size. Different brands fit differently and sizing varies. A retailer's own measurement tables are more reliable than standardised sizes.",
      },
      {
        question: "Which fashion materials are most durable?",
        answer:
          "The longest-lasting materials are wool, linen, high-quality denim, leather and cashmere. They hold their shape, age well and survive many washes. Synthetic blends such as polyester and elastane keep colour longer but lose shape faster and break down in the environment.",
      },
      {
        question: "How do you wash knitwear?",
        answer:
          "Knitwear in wool or cashmere is washed on a wool programme at 30°C max, or by hand in lukewarm water with wool detergent. Spin low, press water out in a towel rather than wringing, and dry flat on a level surface. Don't hang it up — that stretches the shape.",
      },
      {
        question: "What is the difference between an affiliate link and a normal link?",
        answer:
          "An affiliate link contains a tracking code so that whoever shares it earns a commission if someone clicks and buys. For you as the buyer the price is the same — the commission comes out of the retailer's margin. Affiliate links must be clearly marked as advertising.",
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
              Frequently asked questions
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
              Have a question that isn't answered here?{" "}
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
