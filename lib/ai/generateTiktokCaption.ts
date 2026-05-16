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

const SYSTEM_PROMPT = `Du är en TikTok-content-writer för Moidello — en svensk plattform för outfit-inspiration. Tonen är minimal, redaktionell, skandinavisk. Aldrig clickbait, aldrig "obsessed/slay/literally", aldrig utropstecken. Skriv som ett genomtänkt magasin, inte som en TikTok-kommentar — men kort nog att läsas på 3 sekunder.`;

function userPrompt(o: OutfitInput): string {
  const tagLines = o.tags
    .map(
      (t, i) =>
        `${i + 1}. ${t.garment}: ${t.brand} ${t.name}${
          t.color ? ` (${t.color})` : ""
        }`,
    )
    .join("\n");

  return `Skriv en TikTok-caption för denna outfit och returnera STRIKT JSON:

{
  "title": "kort rubrik, 3–6 ord, svenska, evokativ — den första raden i caption:en. Inga emojis. Stor begynnelsebokstav.",
  "description": "1–2 meningar, svenska, beskriv stilen + ett känslo-/säsongsord. Max 200 tecken. Avsluta naturligt — inga punkt-radningar.",
  "hashtags": ["array med exakt 5 hashtags utan # (vi prependar själva). Mix: 1 bred, 1 kategori, 1 kön/stil, #moidello, och outfit-koden som hashtag (t.ex. a042). Bara små bokstäver, inga svenska tecken (ä→a, ö→o, å→a)."]
}

Outfit-data:
- Titel: ${o.title}
- Kategori: ${o.category ?? "okänd"}
- Kön: ${o.gender}
- Outfit-kod: ${o.code ?? "saknas"}
${
  o.tags.length > 0
    ? `- Plagg:\n${tagLines}`
    : "- Plagg: (inga taggade plagg)"
}

Returnera ENDAST JSON, ingen extra text.`;
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY saknas — sätt i Vercel env för TikTok-caption.",
    );
  }
  return new Anthropic({ apiKey });
}

function validate(raw: unknown): TiktokCaption {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Claude returnerade icke-objekt.");
  }
  const o = raw as Record<string, unknown>;

  const title = typeof o.title === "string" ? o.title.trim() : "";
  if (!title || title.length > 100) throw new Error("Ogiltig title.");

  const description =
    typeof o.description === "string" ? o.description.trim() : "";
  if (!description || description.length > 280) {
    throw new Error("Ogiltig description.");
  }

  if (!Array.isArray(o.hashtags) || o.hashtags.length === 0) {
    throw new Error("Ogiltig hashtags-array.");
  }
  const hashtags = (o.hashtags as unknown[])
    .filter((h): h is string => typeof h === "string" && h.trim().length > 0)
    .map((h) => h.trim().replace(/^#+/, "").toLowerCase())
    .filter((h) => /^[a-z0-9_]+$/.test(h))
    .slice(0, 5);
  if (hashtags.length < 3) throw new Error("För få giltiga hashtags.");

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
