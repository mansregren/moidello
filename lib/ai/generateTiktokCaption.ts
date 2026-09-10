/**
 * Genererar TikTok-paket-text (rubrik, beskrivning, 5 hashtags) för en
 * outfit. Text-only (vi har redan outfit-data + plagg-data i DB — Claude
 * behöver inte titta på bilden). Snabb, billig.
 *
 * Hashtag-strategin: mix av bred + smal trafik enligt TikTok-algoritmen:
 *   1. Bred:        #ootd / #outfitinspo / #styleinspo
 *   2. Kategori:    #streetwear / #preppy / #minimalism
 *   3. Kön/stil:    #damstil / #herrmode / #scandinavianstyle
 *   4. Plattform:   #moidello (drar trafik till sajten)
 *   5. Outfit-kod:  #a042 — så tittaren kan söka koden på moidello.com
 */

import Anthropic from "@anthropic-ai/sdk";

export interface TiktokCaption {
  title: string;
  description: string;
  hashtags: string[];
}

interface OutfitInput {
  title: string;
  category: string | null;
  gender: "dam" | "herr";
  code: string | null;
  tags: Array<{
    brand: string;
    name: string;
    garment: string;
    color?: string | null;
  }>;
}

const SYSTEM_PROMPT = `You are a TikTok content writer for Moidello — a platform for outfit inspiration. The tone is minimal, editorial, Scandinavian. Never clickbait, never "obsessed/slay/literally", never exclamation marks. Write like a considered magazine, not a TikTok comment — but short enough to read in 3 seconds. Write in English.`;

function userPrompt(o: OutfitInput): string {
  const tagLines = o.tags
    .map(
      (t, i) =>
        `${i + 1}. ${t.garment}: ${t.brand} ${t.name}${
          t.color ? ` (${t.color})` : ""
        }`,
    )
    .join("\n");

  return `Write a TikTok caption for this outfit and return STRICT JSON:

{
  "title": "a short headline, 3–6 words, English, evocative — the first line of the caption. No emojis. Sentence case.",
  "description": "1–2 sentences, English, describe the style + an emotion/season word. Max 200 characters. End naturally — no bulleted lists.",
  "hashtags": ["array of exactly 5 hashtags without # (we prepend it). Mix: 1 broad, 1 category, 1 gender/style, #moidello, and the outfit code as a hashtag (e.g. a042). Lowercase only, ASCII only."]
}

Outfit data:
- Title: ${o.title}
- Category: ${o.category ?? "unknown"}
- Gender: ${o.gender}
- Outfit code: ${o.code ?? "missing"}
${
  o.tags.length > 0
    ? `- Pieces:\n${tagLines}`
    : "- Pieces: (no tagged pieces)"
}

Return ONLY JSON, no extra text.`;
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is missing — set it in the Vercel env for TikTok captions.",
    );
  }
  return new Anthropic({ apiKey });
}

function validate(raw: unknown): TiktokCaption {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Claude returned a non-object.");
  }
  const o = raw as Record<string, unknown>;

  const title = typeof o.title === "string" ? o.title.trim() : "";
  if (!title || title.length > 100) throw new Error("Invalid title.");

  const description =
    typeof o.description === "string" ? o.description.trim() : "";
  if (!description || description.length > 280) {
    throw new Error("Invalid description.");
  }

  if (!Array.isArray(o.hashtags) || o.hashtags.length === 0) {
    throw new Error("Invalid hashtags array.");
  }
  const hashtags = (o.hashtags as unknown[])
    .filter((h): h is string => typeof h === "string" && h.trim().length > 0)
    .map((h) => h.trim().replace(/^#+/, "").toLowerCase())
    .filter((h) => /^[a-z0-9_]+$/.test(h))
    .slice(0, 5);
  if (hashtags.length < 3) throw new Error("Too few valid hashtags.");

  return { title, description, hashtags };
}

export async function generateTiktokCaption(
  outfit: OutfitInput,
): Promise<TiktokCaption> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt(outfit) }],
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

  return validate(parsed);
}

// ---------- Bulk: one shared caption for several outfits ----------

interface BulkOutfitInput extends OutfitInput {
  /** Outfit id to include in the prompt (Claude can reference the outfit code) */
  outfitId?: string;
}

function bulkUserPrompt(outfits: BulkOutfitInput[]): string {
  const blocks = outfits
    .map((o, idx) => {
      const tagLines = o.tags
        .map(
          (t, i) =>
            `  ${i + 1}. ${t.garment}: ${t.brand} ${t.name}${
              t.color ? ` (${t.color})` : ""
            }`,
        )
        .join("\n");
      return `Outfit ${idx + 1} (code: ${o.code ?? "missing"})
- Title: ${o.title}
- Category: ${o.category ?? "unknown"}
- Gender: ${o.gender}
${o.tags.length > 0 ? `- Pieces:\n${tagLines}` : "- Pieces: (no tagged pieces)"}`;
    })
    .join("\n\n");

  return `Write one shared TikTok caption for these ${outfits.length} outfits and return STRICT JSON:

{
  "title": "ONE shared headline covering all the outfits, 4–7 words English. No emojis. Sentence case.",
  "description": "Write something short about EACH outfit and its key pieces. Include the outfit code for each (e.g. 'A042'). The format should read well on TikTok — one outfit per line is fine, but make it editorial, not a dry list. Max 800 characters total. End naturally.",
  "hashtags": ["exactly 5 hashtags without #. Mix: 1 broad (#ootd or similar), 1 style/category umbrella that fits the set, 1 gender/scandi, #moidello, and #moidelloedit or a category hashtag (the set has no unique code). Lowercase only, ASCII only."]
}

Outfits:

${blocks}

Return ONLY JSON, no extra text.`;
}

export async function generateBulkTiktokCaption(
  outfits: BulkOutfitInput[],
): Promise<TiktokCaption> {
  if (outfits.length === 0) {
    throw new Error("No outfits to generate for.");
  }
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: bulkUserPrompt(outfits) }],
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

  // Bulk-description får vara längre — överrida validate's gräns.
  if (typeof parsed === "object" && parsed !== null) {
    const o = parsed as Record<string, unknown>;
    if (typeof o.description === "string" && o.description.length > 280) {
      // godta upp till 1000 tecken för bulk
      if (o.description.length <= 1000) {
        // bygg om validate-anrop med locally allowed length
        const title = typeof o.title === "string" ? o.title.trim() : "";
        if (!title || title.length > 120) throw new Error("Ogiltig title.");
        const description = o.description.trim();
        if (!Array.isArray(o.hashtags) || o.hashtags.length === 0) {
          throw new Error("Invalid hashtags array.");
        }
        const hashtags = (o.hashtags as unknown[])
          .filter(
            (h): h is string => typeof h === "string" && h.trim().length > 0,
          )
          .map((h) => h.trim().replace(/^#+/, "").toLowerCase())
          .filter((h) => /^[a-z0-9_]+$/.test(h))
          .slice(0, 5);
        if (hashtags.length < 3) throw new Error("Too few valid hashtags.");
        return { title, description, hashtags };
      }
    }
  }

  return validate(parsed);
}

