/**
 * Locale detection for the /go redirect (and anywhere else we need to
 * pick a country for the visitor).
 *
 * Priority order, highest first:
 *   1. Cookie `moidello_locale`  — explicit user preference, always wins.
 *   2. Accept-Language header    — Nordic-priority parse with q-values.
 *                                   Fixes the "Malmö Telia routes through
 *                                   Copenhagen" bug (2026-05-13): mobile
 *                                   IP geo-resolves to DK, but the phone's
 *                                   system language is sv, so the user
 *                                   clearly wants /se/ links.
 *   3. IP-geo                    — Vercel's x-vercel-ip-country header.
 *                                   ISO-2 (e.g. "SE", "DK", "DE"). Only
 *                                   used when Accept-Language doesn't have
 *                                   a Nordic match.
 *   4. Default                   — "SE" (primary market).
 *
 * The helper is pure: it takes plain strings, returns a locale + a source
 * tag. Caller is responsible for reading cookies/headers and logging the
 * source.
 */

export const LOCALE_COOKIE = "moidello_locale";

export const SUPPORTED_LOCALES = [
  "SE",
  "NO",
  "DK",
  "FI",
  "DE",
  "GB",
  "US",
] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "SE";

export type LocaleSource =
  | "cookie"
  | "accept-language"
  | "ip"
  | "default";

export interface DetectionResult {
  locale: Locale;
  source: LocaleSource;
}

function isSupported(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

// Languages we treat as Nordic for Accept-Language priority. Each maps to
// the locale (= country) of its primary market.
const NORDIC_LANGUAGES: Record<string, Locale> = {
  sv: "SE",
  da: "DK",
  no: "NO",
  nb: "NO",
  nn: "NO",
  fi: "FI",
};

const NORDIC_COUNTRIES = new Set<Locale>(["SE", "NO", "DK", "FI"]);

interface AcceptLanguageTag {
  tag: string; // lowercased, e.g. "sv-se", "en", "fi"
  q: number;
}

/**
 * Parse an Accept-Language header into tags ordered by q-value (desc).
 * Tags without an explicit q default to 1.0. Malformed q values are
 * silently dropped to 1.0 rather than rejected.
 */
function parseAcceptLanguage(header: string): AcceptLanguageTag[] {
  return header
    .split(",")
    .map((entry) => {
      const trimmed = entry.trim();
      if (!trimmed) return null;
      const [rawTag, ...params] = trimmed.split(";");
      const tag = rawTag.trim().toLowerCase();
      if (!tag) return null;
      const qParam = params.find((p) => p.trim().toLowerCase().startsWith("q="));
      const qValue = qParam
        ? Number(qParam.trim().slice(2))
        : 1.0;
      const q = Number.isFinite(qValue) ? qValue : 1.0;
      return { tag, q };
    })
    .filter((t): t is AcceptLanguageTag => t !== null)
    .sort((a, b) => b.q - a.q);
}

/**
 * Walk q-ordered Accept-Language tags and return the first locale that
 * maps to a Nordic market. Returns null when no Nordic preference is
 * expressed — the caller should then fall through to IP-geo.
 *
 * Both the explicit country suffix ("sv-SE", "en-SE") and the language-
 * only form ("sv") are accepted. Region suffix takes precedence within
 * a single tag — that lets a Swedish-speaking Finn ("sv-FI") land on FI,
 * not SE.
 */
function localeFromAcceptLanguage(header: string): Locale | null {
  const tags = parseAcceptLanguage(header);
  for (const { tag } of tags) {
    // Region suffix: "sv-SE", "en-SE", "sv-FI", "nb-NO"
    const m = tag.match(/^[a-z]{2,3}-([a-z]{2})$/);
    if (m) {
      const cc = m[1].toUpperCase() as Locale;
      if (NORDIC_COUNTRIES.has(cc)) return cc;
    }
    // Language-only or fallback to base language: "sv", "da", "no", "nb"...
    const lang = tag.split("-")[0];
    const mapped = NORDIC_LANGUAGES[lang];
    if (mapped) return mapped;
  }
  return null;
}

export interface DetectLocaleInput {
  /** Raw cookie value of `moidello_locale`, or null/undefined. */
  cookie?: string | null;
  /** Raw `accept-language` header, or null/undefined. */
  acceptLanguage?: string | null;
  /** Raw `x-vercel-ip-country` value (ISO-2 uppercase), or null. */
  ipCountry?: string | null;
}

/**
 * Detect the visitor's preferred locale. Pure function — no header or
 * cookie reads of its own. See module-level comment for the priority
 * order. The returned `source` lets callers log which signal won so we
 * can monitor Accept-Language-vs-IP disagreements in Vercel logs.
 */
export function detectLocale(input: DetectLocaleInput): DetectionResult {
  // 1. Cookie (explicit preference).
  if (input.cookie) {
    const c = input.cookie.trim().toUpperCase();
    if (isSupported(c)) return { locale: c, source: "cookie" };
  }

  // 2. Accept-Language (Nordic priority — beats IP).
  if (input.acceptLanguage) {
    const al = localeFromAcceptLanguage(input.acceptLanguage);
    if (al) return { locale: al, source: "accept-language" };
  }

  // 3. IP-geo (Vercel edge header).
  if (input.ipCountry) {
    const cc = input.ipCountry.trim().toUpperCase();
    if (isSupported(cc)) return { locale: cc, source: "ip" };
  }

  // 4. Platform default.
  return { locale: DEFAULT_LOCALE, source: "default" };
}
