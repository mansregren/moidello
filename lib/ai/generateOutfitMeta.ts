/**
 * Claude-backed outfit-meta generator. Takes an image URL + optional
 * category hint and returns structured SEO metadata for the bild-först
 * admin seedning-flow.
 *
 * Designed to be testable in isolation: pure function with a single
 * external dependency (ANTHROPIC_API_KEY in env). Fail-soft for the
 * caller — throws on parsing/API errors so the bulk endpoint can
 * catch and put each failure on a per-image error list.
 */

import Anthropic from "@anthropic-ai/sdk";

export const OUTFIT_CATEGORIES = [
  "streetwear",
  "minimalism",
  "vintage",
  "casual",
  "formal",
  "sporty",
  "bohemian",
  "preppy",
] as const;

export type OutfitCategory = (typeof OUTFIT_CATEGORIES)[number];

export interface OutfitMeta {
  title: string;
  meta_description: string;
  keywords: string[];
  alt_text: string;
  category: OutfitCategory;
  suggested_items: string[];
}

const SYSTEM_PROMPT = `Du är en mode-curator för Moidello, en svensk plattform för outfit-inspiration. Tonen är minimalistisk, redaktionell, skandinavisk. Undvik klichér som "outfit goals", "obsessed", "slay". Skriv som ett genomtänkt magasin, inte som en TikTok-kommentar.`;

function userPrompt(categoryHint?: string | null): string {
  return `Analysera outfiten på bilden och returnera STRIKT JSON med fälten:

- title: 2–4 ord, engelska, evokativt (t.ex. "Linen Set & Espadrilles", "Camel & Cream"). Matcha stilen i befintliga Moidello-titlar.
- meta_description: svenska, 140–155 tecken inklusive mellanslag. Börja med stil/plagg, väv in ett känslo- eller säsongsord, avsluta naturligt. Inga utropstecken.
- keywords: array med 5–8 svenska keywords. Blanda bred (outfit-inspiration, minimalism) med smal (linnedress, beige-look, sommar-outfit).
- alt_text: svenska, beskrivande, en mening. Inkludera plaggtyper och färger så Google Images förstår vad bilden visar.
- category: välj EN av: streetwear, minimalism, vintage, casual, formal, sporty, bohemian, preppy.
- suggested_items: array med 3–6 strängar som beskriver plaggen som syns (t.ex. "vit linnedress", "beigea espadriller"). Detta är hint till admin för att tagga senare — inga brands, bara plaggtyp + färg.

Om en kategori-hint ges, prioritera den om bilden tillåter.
Kategori-hint: ${categoryHint ?? "ingen"}

Returnera ENDAST JSON, ingen extra text.`;
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY saknas — sätt i Vercel env för att aktivera bild-först-seedning.",
    );
  }
  return new Anthropic({ apiKey });
}

/**
 * Fetch the image and return its base64 + media-type. Claude's vision
 * input accepts either a URL or a base64 inline payload — we use inline
 * because the image may be on a private Supabase storage URL with a
 * short-lived signed token, and Claude resolution-side caching wouldn't
 * see updates anyway.
 */
async function fetchImageAsBase64(
  imageUrl: string,
): Promise<{ base64: string; mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" }> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Kunde inte hämta bilden (${res.status})`);
  }
  const contentType = (res.headers.get("content-type") ?? "image/jpeg").toLowerCase();
  let mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" =
    "image/jpeg";
  if (contentType.includes("png")) mediaType = "image/png";
  else if (contentType.includes("webp")) mediaType = "image/webp";
  else if (contentType.includes("gif")) mediaType = "image/gif";

  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return { base64, mediaType };
}

function validateMeta(raw: unknown): OutfitMeta {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Claude returnerade icke-objekt.");
  }
  const o = raw as Record<string, unknown>;

  const title = typeof o.title === "string" ? o.title.trim() : "";
  if (!title || title.length > 80) {
    throw new Error("Ogiltig title.");
  }

  const meta_description =
    typeof o.meta_description === "string" ? o.meta_description.trim() : "";
  if (!meta_description || meta_description.length > 200) {
    throw new Error("Ogiltig meta_description.");
  }

  if (!Array.isArray(o.keywords) || o.keywords.length < 3 || o.keywords.length > 10) {
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

  const category = typeof o.category === "string" ? o.category.toLowerCase().trim() : "";
  if (!OUTFIT_CATEGORIES.includes(category as OutfitCategory)) {
    throw new Error(`Ogiltig kategori: ${category}`);
  }

  const suggested_items = Array.isArray(o.suggested_items)
    ? (o.suggested_items as unknown[])
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .map((s) => s.trim())
        .slice(0, 6)
    : [];

  return {
    title,
    meta_description,
    keywords,
    alt_text,
    category: category as OutfitCategory,
    suggested_items,
  };
}

/**
 * Generate outfit metadata from an image URL. Throws on any failure
 * (network, Claude error, invalid JSON, schema mismatch). Caller wraps
 * each call in try/catch in the bulk endpoint.
 */
export async function generateOutfitMeta(
  imageUrl: string,
  categoryHint?: string | null,
): Promise<OutfitMeta> {
  const client = getClient();
  const { base64, mediaType } = await fetchImageAsBase64(imageUrl);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: "text",
            text: userPrompt(categoryHint),
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returnerade ingen text.");
  }

  // Be lenient about leading/trailing whitespace or stray code-fence markers
  // even though the prompt says JSON-only.
  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Claude returnerade ogiltig JSON.");
  }

  return validateMeta(parsed);
}
