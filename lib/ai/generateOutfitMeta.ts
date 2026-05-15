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
- category: välj EN av: streetwear, minimalism, vintage, casual, formal, sporty, preppy.
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

type SupportedMedia = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

/**
 * Inspect the leading bytes of a buffer to determine the actual image
 * format. Supabase storage returns content-type based on filename
 * extension, which sometimes lies (a `.png` file may actually be webp).
 * Claude's vision API rejects payloads where the declared media-type
 * mismatches the binary, so we sniff instead of trusting the header.
 */
function sniffMediaType(buf: Uint8Array): SupportedMedia | null {
  if (buf.length < 12) return null;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  )
    return "image/png";
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // GIF: 47 49 46 38 ('GIF8')
  if (
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38
  )
    return "image/gif";
  // WebP: 'RIFF'....'WEBP'
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return "image/webp";
  return null;
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
): Promise<{ base64: string; mediaType: SupportedMedia }> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Kunde inte hämta bilden (${res.status})`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const sniffed = sniffMediaType(bytes);
  if (!sniffed) {
    throw new Error(
      "Bilden är inte i ett format Claude kan läsa (JPEG/PNG/WebP/GIF).",
    );
  }

  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return { base64, mediaType: sniffed };
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
