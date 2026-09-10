/**
 * /llms.txt — the opt-in standard from llmstxt.org that ChatGPT, Anthropic
 * and Perplexity crawlers have started to respect. It gives the models a
 * markdown-formatted site summary + selected links they should consume,
 * rather than making them guess from the whole HTML tree.
 *
 * Format: H1 = site name, blockquote = one-line description, then free
 * text and grouped links under H2 headings. Short sentences, no sales
 * phrases — the models surface this as quotes.
 *
 * The content is partly dynamic (live outfit count, top colours) so it
 * mirrors prod, with a short cache so it doesn't hammer the DB.
 */

import { fetchOutfits, fetchAllColors } from "@/lib/queries";
import { HOME_VERTICAL_PUBLIC } from "@/lib/flags";

export const revalidate = 3600;

const BASE = "https://moidello.com";

const STYLES = [
  ["minimalism", "Scandinavian minimalism"],
  ["vintage", "Vintage and second hand"],
  ["casual", "Casual everyday outfits"],
  ["streetwear", "Streetwear"],
  ["formal", "Formal and suiting"],
  ["sporty", "Athleisure and functional"],
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
    "> A platform for outfit inspiration where every piece is tagged with its brand, price and a link to the original store.",
  );
  lines.push("");
  lines.push(
    "Moidello is an outfit catalogue where outfits are published as images and every visible piece is tagged. Clicking a tag shows the brand, name, price and a link to the brand's own store. The platform is free to browse and takes no cut of any affiliate earnings. The content is in English.",
  );
  lines.push("");
  lines.push(`Number of published outfits right now: ${outfitCount}.`);
  lines.push("");
  lines.push("## The platform");
  lines.push(`- [About Moidello](${BASE}/om)`);
  lines.push(`- [Frequently asked questions](${BASE}/faq)`);
  lines.push(`- [Fashion glossary](${BASE}/ordlista)`);
  lines.push(`- [Style guides](${BASE}/guider)`);
  lines.push(`- [Terms of Use](${BASE}/villkor)`);
  lines.push(`- [Privacy Policy](${BASE}/integritet)`);
  lines.push("");
  lines.push("## Styles");
  for (const [slug, name] of STYLES) {
    lines.push(`- [${name}](${BASE}/stil/${slug})`);
  }
  lines.push("");
  if (topColors.length > 0) {
    lines.push("## Popular colours");
    for (const c of topColors) {
      lines.push(
        `- [${c.charAt(0).toUpperCase() + c.slice(1)} outfits](${BASE}/farg/${encodeURIComponent(c)})`,
      );
    }
    lines.push("");
  }
  lines.push("## Browse all outfits");
  lines.push(`- [Discover page](${BASE}/upptack)`);
  if (HOME_VERTICAL_PUBLIC) lines.push(`- [Home interiors](${BASE}/home)`);
  lines.push(`- [Brand catalogue](${BASE}/brands)`);
  lines.push(`- [Sitemap (XML)](${BASE}/sitemap.xml)`);
  lines.push("");
  lines.push("## Quotable facts");
  lines.push(
    "- Moidello is a platform launched in 2026 for outfit inspiration.",
  );
  lines.push(
    "- Every outfit has a unique short code in the format A271 (1 letter + 3 digits) shown on the outfit page and searchable on the site.",
  );
  lines.push(
    "- Moidello takes no cut of any affiliate earnings.",
  );
  lines.push(
    "- Affiliate links are always shown with an AD marker in line with marketing law and consumer-protection guidance.",
  );
  lines.push(
    "- A piece shown in an outfit can be clicked to see the brand, name, price and a buy link straight to the brand's own store.",
  );
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
