/**
 * Claude-backed item-meta generator. Mirrors generateOutfitMeta but for
 * tagged_items: takes the structured data we already have on a tagged
 * item (brand, name, garment, color, retailer, price) and asks Claude to
 * fill in long-form description, keywords, alt-text and material.
 *
 * We deliberately skip vision here. Item images are croppings of an
 * outfit photo at a pin position — high noise, low product-shot signal.
 * Text-only generation is 10x cheaper and produces sharper SEO copy
 * since the model can focus on the explicit brand/name/color/garment
 * facts rather than guessing from a blurry crop.
 */

import Anthropic from "@anthropic-ai/sdk";

export interface ItemMeta {
  description: string;
  keywords: string[];
  alt_text: string;
  material: string | null;
}

const SYSTEM_PROMPT = `Du är en mode-curator för Moidello, en svensk plattform för outfit-inspiration. Skriv redaktionellt, lugnt och konkret. Ingen klickretorik, inga utropstecken, inga emojis. Tonen är skandinaviskt minimalistisk — som ett magasin, inte som en webshop.`;

interface PromptInput {
  brand: string;
  name: string;
  garment: string;
  color?: string | null;
  retailer?: string | null;
  price?: number | null;
  currency?: string | null;
  outfitTitle?: string | null;
  outfitCategory?: string | null;
}

function userPrompt(input: PromptInput): string {
  const lines = [
    `Märke: ${input.brand}`,
    `Produktnamn: ${input.name}`,
    `Kategori: ${input.garment}`,
  ];
  if (input.color) lines.push(`Färg: ${input.color}`);
  if (input.retailer) lines.push(`Återförsäljare: ${input.retailer}`);
  if (input.price && input.price > 0) {
    lines.push(`Pris: ${input.price} ${input.currency ?? "SEK"}`);
  }
  if (input.outfitTitle) lines.push(`Sett i outfit: ${input.outfitTitle}`);
  if (input.outfitCategory) lines.push(`Outfit-stil: ${input.outfitCategory}`);

  return `Plagg-fakta:
${lines.join("\n")}

Skriv SEO-meta för plaggets sida. Returnera STRIKT JSON med fälten:

- description: svenska, 280–500 tecken. En sammanhängande paragraf (inga punktlistor). Beskriv plagget konkret: silhuett, material om uppenbart från namnet, typisk styling, säsong. Avsluta med en mening om hur det kan kombineras. Inga superlativ ("fantastisk", "perfekt"). Inga säljfraser ("missa inte"). Naturligt språk.
- keywords: array med 5–8 svenska keywords. Blanda generella ("beige trenchcoat", "minimalism") med specifika ("oversized fit", "höst-outfit dam"). Allt gemener. Inga märkesnamn i listan (de finns redan strukturerat).
- alt_text: en mening, 80–200 tecken. Beskriv vad bilden visar så Google Images förstår. Inkludera färg + plaggtyp + märke.
- material: om materialet kan härledas säkert från produktnamnet (t.ex. "linne-skjorta" → "Linne", "denim-jacka" → "Denim"), returnera ordet med stor bokstav. Annars null.

Returnera ENDAST JSON, ingen extra text.`;
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY saknas — sätt i Vercel env för att aktivera plagg-SEO-backfill.",
    );
  }
  return new Anthropic({ apiKey });
}

function validateMeta(raw: unknown): ItemMeta {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Claude returnerade icke-objekt.");
  }
  const o = raw as Record<string, unknown>;

  const description =
    typeof o.description === "string" ? o.description.trim() : "";
  if (!description || description.length < 80 || description.length > 600) {
    throw new Error(
      `Ogiltig description (längd ${description.length}, kräver 80–600).`,
    );
  }

  if (
    !Array.isArray(o.keywords) ||
    o.keywords.length < 3 ||
    o.keywords.length > 10
  ) {
    throw new Error("Ogiltig keywords-array.");
  }
  const keywords = (o.keywords as unknown[])
    .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
    .map((k) => k.trim().toLowerCase())
    .slice(0, 10);
  if (keywords.length < 3) throw new Error("För få giltiga keywords.");

  const alt_text = typeof o.alt_text === "string" ? o.alt_text.trim() : "";
  if (!alt_text || alt_text.length > 400) {
    throw new Error("Ogiltig alt_text.");
  }

  let material: string | null = null;
  if (typeof o.material === "string") {
    const trimmed = o.material.trim();
    if (trimmed && trimmed.toLowerCase() !== "null" && trimmed.length <= 60) {
      material = trimmed;
    }
  }

  return { description, keywords, alt_text, material };
}

/**
 * Generate item metadata from structured inputs. Throws on any failure;
 * caller wraps in try/catch for per-item error reporting.
 */
export async function generateItemMeta(input: PromptInput): Promise<ItemMeta> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt(input) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returnerade ingen text.");
  }

  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Claude returnerade ogiltig JSON.");
  }

  return validateMeta(parsed);
}
