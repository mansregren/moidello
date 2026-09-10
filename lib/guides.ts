/**
 * Hand-curated style guides. Structured as data so the HowTo schema and
 * page rendering share one source. Per moidello-brand-namedropping: no
 * brands are named in the text without a formal partnership, so the steps
 * stick to garment types, materials and proportions.
 */

export interface Guide {
  slug: string;
  title: string;
  intro: string;
  metaDescription: string;
  totalTime?: string;
  steps: { name: string; text: string }[];
  /** Related outfit categories for cross-linking on the page. */
  related?: {
    styles?: string[];
    garments?: { gender: "dam" | "herr"; garment: string }[];
    colors?: string[];
  };
}

export const GUIDES: Guide[] = [
  {
    slug: "scandinavian-minimalism",
    title: "Scandinavian minimalism — a guide to the style",
    intro:
      "Scandinavian minimalism is one of the most distinct Nordic styles and rests on neutral colour palettes, clean silhouettes and pieces of high material quality. It prioritises fit and durability over trends, and works at any age.",
    metaDescription:
      "A guide to Scandinavian minimalism in fashion. Learn the fundamentals of the Nordic style — colour palette, garments, materials and proportions.",
    totalTime: "PT15M",
    steps: [
      {
        name: "Build a neutral base wardrobe",
        text: "Start with pieces in black, white, beige, grey and navy. These five colours combine freely and give a calm whole. Avoid bold patterns in the base layer — it's a deliberate choice, not dullness.",
      },
      {
        name: "Choose natural materials",
        text: "Scandinavian minimalism relies on materials that age well — wool, linen, cotton, leather, suede and cashmere. Material shows everywhere: in the drape, in how a knit sits, in how the leather of a shoe breaks in.",
      },
      {
        name: "Prioritise fit over size",
        text: "Pieces should be well cut but not tight. A little extra fabric in the sleeve and length gives the effortless volume that defines the style. Fully oversized or fully skin-tight doesn't belong here.",
      },
      {
        name: "Add one accent per outfit",
        text: "A single accent keeps the whole calm. It could be a deep red shirt, a camel jacket or a contrasting bag. Two accents is too much.",
      },
      {
        name: "Keep accessories minimal",
        text: "A watch, a fine necklace, a small bag. Jewellery is muted — gold or silver, rarely both, never statement. Less isn't poorer, it's deliberate.",
      },
      {
        name: "Keep pieces for a long time",
        text: "Scandinavian minimalism is anti-fast-fashion by nature. Pieces are meant to be worn for years. Invest in higher quality on the base (outerwear, shoes, jeans) and hold on to the rest.",
      },
    ],
    related: {
      styles: ["minimalism", "casual"],
      colors: ["beige", "black", "white"],
    },
  },
  {
    slug: "build-a-core-wardrobe",
    title: "Build a core wardrobe — a capsule wardrobe",
    intro:
      "A core wardrobe, or capsule wardrobe, is a wardrobe where every piece combines with every other. For a Nordic climate you need layers for four seasons. Count on 30–40 pieces excluding underwear and sportswear.",
    metaDescription:
      "A guide to the capsule wardrobe — how to build a core wardrobe of 30–40 pieces that covers the whole year.",
    totalTime: "PT30M",
    steps: [
      {
        name: "Define your colour palette",
        text: "Choose three core base colours (e.g. black, white, beige) and two accent colours (e.g. dark green, camel). Every new piece must fit at least one base and one accent colour. This is what lets every piece combine.",
      },
      {
        name: "Build layer 1 — base pieces",
        text: "T-shirts (3–5), long-sleeve base tops (2–3), socks and underwear. This sits under everything else and wears out fastest. Buy good quality but not premium — they'll need replacing anyway.",
      },
      {
        name: "Build layer 2 — mid layer",
        text: "Knits (3–4), shirts or blouses (3–4), maybe a blazer. This is the piece that shows most in an outfit and is worth more investment. Think material before colour.",
      },
      {
        name: "Build layer 3 — outerwear",
        text: "A winter coat, a rain or autumn coat, a lighter jacket for spring. Three outerwear pieces cover every temperature. Invest most here — a good coat lasts ten years.",
      },
      {
        name: "Build layer 4 — trousers and skirts",
        text: "Two pairs of jeans (one dark, one light), a pair of chinos, a more formal trouser or a skirt. Four bottoms go further than most people think if the fit is right.",
      },
      {
        name: "Build the shoe set",
        text: "White sneakers, leather boots, a more formal shoe (loafers, derbies, heels), rain boots or shoes. Four pairs cover every situation; more is nice but not necessary.",
      },
      {
        name: "Audit once a year",
        text: "Once per season: go through the wardrobe and pull out anything you haven't worn in 12 months. Sell or donate. A capsule wardrobe isn't static — it grows slowly and is cleared deliberately.",
      },
    ],
    related: {
      styles: ["minimalism", "casual"],
    },
  },
  {
    slug: "smart-casual-for-work",
    title: "Smart casual for work — how to style it",
    intro:
      "Smart casual is the most common dress code for modern office environments. It sits between formal and relaxed and requires you to understand what signals respect without being stiff.",
    metaDescription:
      "A guide to smart casual for work. How to build outfits that signal professional without being stiff — for women and men.",
    totalTime: "PT10M",
    steps: [
      {
        name: "Choose the bottom",
        text: "Dark jeans without distressing, chinos in a beige or dark green tone, or a dark mid-rise trouser or skirt. Joggers, shorts or ripped jeans don't belong here. The length should be clear — either cropped at the ankle or at the ankle bone.",
      },
      {
        name: "Build the top in layers",
        text: "A t-shirt layer is too informal; a blouse or shirt is the base. Add a knit, a blazer or a cardigan over it. Two layers is the minimum to not look underdressed.",
      },
      {
        name: "Choose shoes that tie it together",
        text: "Leather shoes or minimalist sneakers (white, beige or black). No running shoes, no heels over 5 cm. The shoe should sit cleanly under the trouser and not distract from the rest.",
      },
      {
        name: "Keep accessories controlled",
        text: "A watch, a pair of discreet earrings or a fine chain, a bag in leather or canvas. No statement jewellery, no visible logos. The belt is matched to the shoe in tone.",
      },
      {
        name: "Adjust to the company culture",
        text: "At a law firm, smart casual is closer to formal; at a tech company, closer to casual. Look at the manager — dress one level above your colleague, one level below your manager. That's the safe zone.",
      },
    ],
    related: {
      styles: ["formal", "preppy"],
    },
  },
  {
    slug: "nordic-autumn-wardrobe",
    title: "An autumn wardrobe for a Nordic climate",
    intro:
      "A Nordic autumn means above freezing during the day and near zero in the evening, rain several times a week, and strong variation between August and November. The wardrobe has to handle all of that on the same day.",
    metaDescription:
      "A guide to a Nordic autumn wardrobe — pieces, materials and layers that handle rain, wind and temperature swings all season.",
    totalTime: "PT15M",
    steps: [
      {
        name: "Invest in a good trench coat or leather jacket",
        text: "The mid-season coat is autumn's most important piece. A trench coat in cotton or gabardine takes rain and wind without getting too warm. A leather jacket works for drier days and handles weather better than wool.",
      },
      {
        name: "Knits as a mid layer",
        text: "Two or three knits in different weights — a thin one (merino wool) as a base, a medium as a standalone top, a heavier one as a layer under the coat. Mohair and cashmere are warmer but more delicate.",
      },
      {
        name: "Boots with a proper sole",
        text: "Leather or suede boots with a rubber sole take both rain and brisk walks. Treat the leather before the season with wax or a waterproofer. Rotate two pairs so they can dry out between wears.",
      },
      {
        name: "Jeans and chinos in a heavier fabric",
        text: "Thinner summer trousers are swapped for 14oz+ denim or chinos in heavy cotton. Darker tones are the season's base note. Creases and pressing are kept loose — autumn isn't summer's sharp silhouette.",
      },
      {
        name: "Protect against rain",
        text: "Either a rain coat over the usual coat, or an umbrella that fits in the bag. In heavy rain (common in October/November) a waterproof jacket is a must. Ordinary outerwear handles no more than drizzle.",
      },
      {
        name: "Scarf and hat when needed",
        text: "From October a scarf becomes essential. Thin wool is the most versatile — it works as an accessory early in the season and as warmth when needed. A hat is added around 5°C and below.",
      },
    ],
    related: {
      styles: ["minimalism", "casual"],
      colors: ["beige", "brown"],
    },
  },
  {
    slug: "how-to-style-baggy-jeans",
    title: "How to style baggy jeans",
    intro:
      "Baggy jeans have gone from statement to mainstream. The style needs more balancing than skinny jeans did — when the bottom is voluminous, the rest of the outfit has to compensate.",
    metaDescription:
      "A guide to baggy jeans — how to balance proportions, shoes, waist and top for an outfit that reads deliberate rather than big.",
    totalTime: "PT8M",
    steps: [
      {
        name: "Balance with a fitted top",
        text: "Volume at both ends makes the whole outfit shapeless. A tailored shirt, a knit that sits close to the body or a well-tucked t-shirt creates visual counterweight. An oversized top plus baggy jeans only works if one is drastically shorter.",
      },
      {
        name: "Handle the waist deliberately",
        text: "Baggy jeans often sit low or mid-rise. Tuck the top in and the waist shows — that narrows the whole silhouette. A belt in a contrasting colour draws the eye and defines the point where the proportions shift.",
      },
      {
        name: "Choose a shoe with the right profile",
        text: "The shoe should take up space without being swallowed by the jeans. Sneakers with a thicker sole, loafers, or chunky boots work best. Thin low sneakers or pointed dress shoes look wrong — they disappear under the fabric.",
      },
      {
        name: "Adjust the length",
        text: "Baggy jeans should either stop just above the shoe or fold up once on top. Stacked (too long, pooling at the foot) gives a specific '90s look. Decide in advance — the in-between lengths look untidy.",
      },
      {
        name: "Add a jacket that follows the volume",
        text: "A bomber jacket, a short leather jacket or a cropped trench. Long straight coats also work if the coat has its own volume. Slim tailored coats clash with the jeans' silhouette.",
      },
    ],
    related: {
      styles: ["streetwear", "casual"],
      garments: [
        { gender: "dam", garment: "Jeans" },
        { gender: "herr", garment: "Jeans" },
      ],
    },
  },
];

export function findGuide(slug: string): Guide | null {
  const normalized = slug.toLowerCase();
  return GUIDES.find((g) => g.slug === normalized) ?? null;
}
