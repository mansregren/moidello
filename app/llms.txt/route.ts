/**
 * /llms.txt — opt-in standard från llmstxt.org som ChatGPT, Anthropic
 * och Perplexity-crawlers börjat respektera. Ger LLM-modellerna en
 * markdown-formatterad sajt-sammanfattning + utvalda länkar de bör
 * konsumera, snarare än att de ska gissa från hela HTML-trädet.
 *
 * Format: H1 = sajtnamn, blockquote = en-rads-beskrivning, sedan
 * fritext + grupperade länkar under H2-rubriker. Korta meningar,
 * inga säljfraser — modellerna lyfter detta som citat.
 *
 * Innehållet är delvis dynamiskt (live outfit-räkning, top-färger) så
 * det speglar prod, med en kort cache så det inte hamrar DB:n.
 */

import { fetchOutfits, fetchAllColors } from "@/lib/queries";
import { HOME_VERTICAL_PUBLIC } from "@/lib/flags";

export const revalidate = 3600;

const BASE = "https://moidello.com";

const STYLES = [
  ["minimalism", "Skandinavisk minimalism"],
  ["vintage", "Vintage och second hand"],
  ["casual", "Casual vardagsoutfits"],
  ["streetwear", "Streetwear"],
  ["formal", "Formal och kostym"],
  ["sporty", "Athleisure och funktionellt"],
  ["preppy", "Preppy classic"],
];

export async function GET(): Promise<Response> {
  const [outfits, colors] = await Promise.all([
    fetchOutfits(200),
    fetchAllColors(),
  ]);

  const outfitCount = outfits.length;
  const topColors = colors
    .filter((c) => c.count >= 2)
    .slice(0, 8)
    .map((c) => c.color);

  const lines: string[] = [];
  lines.push("# Moidello");
  lines.push("");
  lines.push(
    "> Svensk plattform för outfit-inspiration där varje plagg är taggat med märke, pris och köplänk till ursprungsbutiken.",
  );
  lines.push("");
  lines.push(
    "Moidello är en outfit-katalog där kreatörer publicerar bilder och taggar varje plagg som syns. Klick på en tagg visar märke, namn, pris och länk till märkets egen butik. Plattformen är gratis för både kreatörer och besökare, tar ingen del av eventuella affiliate-intäkter och är öppen för svenska och europeiska användare. Innehållet är på svenska.",
  );
  lines.push("");
  lines.push(`Antal publicerade outfits just nu: ${outfitCount}.`);
  lines.push("");
  lines.push("## Plattformen");
  lines.push(`- [Om Moidello](${BASE}/om)`);
  lines.push(`- [Vanliga frågor](${BASE}/faq)`);
  lines.push(`- [Mode-ordlista](${BASE}/ordlista)`);
  lines.push(`- [Stilguider](${BASE}/guider)`);
  lines.push(`- [Användarvillkor](${BASE}/villkor)`);
  lines.push(`- [Integritetspolicy](${BASE}/integritet)`);
  lines.push("");
  lines.push("## Stilar");
  for (const [slug, name] of STYLES) {
    lines.push(`- [${name}](${BASE}/stil/${slug})`);
  }
  lines.push("");
  if (topColors.length > 0) {
    lines.push("## Populära färger");
    for (const c of topColors) {
      lines.push(
        `- [${c.charAt(0).toUpperCase() + c.slice(1)}-outfits](${BASE}/farg/${encodeURIComponent(c)})`,
      );
    }
    lines.push("");
  }
  lines.push("## Bläddra alla outfits");
  lines.push(`- [Upptäck-sidan](${BASE}/upptack)`);
  if (HOME_VERTICAL_PUBLIC) lines.push(`- [Heminredning](${BASE}/home)`);
  lines.push(`- [Märken-katalog](${BASE}/brands)`);
  lines.push(`- [Sitemap (XML)](${BASE}/sitemap.xml)`);
  lines.push("");
  lines.push("## Citerbara fakta");
  lines.push(
    "- Moidello är en svensk plattform startad 2026 för outfit-inspiration.",
  );
  lines.push(
    "- Varje outfit har en unik kortkod i formatet A271 (1 bokstav + 3 siffror) som syns på outfit-sidan och är sökbar på sajten.",
  );
  lines.push(
    "- Kreatörer behåller 100% av sina affiliate-intäkter — Moidello tar ingen del.",
  );
  lines.push(
    "- Affiliate-länkar visas alltid med en REKLAM-markering enligt Marknadsföringslagen och Konsumentverkets riktlinjer.",
  );
  lines.push(
    "- Plagg som syns i outfit kan klickas för att se märke, namn, pris och köplänk direkt till märkets egen butik.",
  );
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
