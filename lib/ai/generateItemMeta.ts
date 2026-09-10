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

const SYSTEM_PROMPT = `You are a fashion curator for Moidello, a platform for outfit inspiration. Write editorially, calmly and concretely. No clickbait, no exclamation marks, no emojis. The tone is Scandinavian minimalist — like a magazine, not a webshop. Write in English.`;

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
    `Brand: ${input.brand}`,
    `Product name: ${input.name}`,
    `Category: ${input.garment}`,
  ];
  if (input.color) lines.push(`Colour: ${input.color}`);
  if (input.retailer) lines.push(`Retailer: ${input.retailer}`);
  if (input.price && input.price > 0) {
    lines.push(`Price: ${input.price} ${input.currency ?? "SEK"}`);
  }
  if (input.outfitTitle) lines.push(`Seen in outfit: ${input.outfitTitle}`);
  if (input.outfitCategory) lines.push(`Outfit style: ${input.outfitCategory}`);

  return `Piece facts:
${lines.join("\n")}

Write SEO meta for the piece's page. Return STRICT JSON with the fields:

- description: English, 280–500 characters. One cohesive paragraph (no bullet lists). Describe the piece concretely: silhouette, material if obvious from the name, typical styling, season. End with a sentence on how it can be combined. No superlatives ("amazing", "perfect"). No sales phrases ("don't miss out"). Natural language.
- keywords: array of 5–8 English keywords. Mix general ("beige trench coat", "minimalism") with specific ("oversized fit", "women's autumn outfit"). All lowercase. No brand names in the list (they are already structured).
- alt_text: one sentence, 80–200 characters. Describe what the image shows so Google Images understands. Include colour + garment type + brand.
- material: if the material can be safely derived from the product name (e.g. "linen shirt" → "Linen", "denim jacket" → "Denim"), return the word capitalised. Otherwise null.

Return ONLY JSON, no extra text.`;
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is missing — set it in the Vercel env to enable piece SEO backfill.",
    );
  }
  return new Anthropic({ apiKey });
}

function validateMeta(raw: unknown): ItemMeta {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Claude returned a non-object.");
  }
  const o = raw as Record<string, unknown>;

  const description =
    typeof o.description === "string" ? o.description.trim() : "";
  if (!description || description.length < 80 || description.length > 600) {
    throw new Error(
      `Invalid description (length ${description.length}, requires 80–600).`,
    );
  }

  if (
    !Array.isArray(o.keywords) ||
    o.keywords.length < 3 ||
    o.keywords.length > 10
  ) {
    throw new Error("Invalid keywords array.");
  }
  const keywords = (o.keywords as unknown[])
    .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
    .map((k) => k.trim().toLowerCase())
    .slice(0, 10);
  if (keywords.length < 3) throw new Error("Too few valid keywords.");

  const alt_text = typeof o.alt_text === "string" ? o.alt_text.trim() : "";
  if (!alt_text || alt_text.length > 400) {
    throw new Error("Invalid alt_text.");
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
