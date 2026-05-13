import { describe, expect, test } from "vitest";
import { detectLocale } from "./detect-locale";

describe("detectLocale priority order", () => {
  test("cookie wins over Accept-Language and IP", () => {
    const r = detectLocale({
      cookie: "NO",
      acceptLanguage: "sv-SE,sv;q=0.9",
      ipCountry: "DK",
    });
    expect(r).toEqual({ locale: "NO", source: "cookie" });
  });

  test("Accept-Language wins over IP for Nordic match", () => {
    // The Malmö Telia case: phone system is Swedish, IP geo-routes
    // through Copenhagen, but the user clearly wants /se/.
    const r = detectLocale({
      cookie: null,
      acceptLanguage: "sv-SE,sv;q=0.9",
      ipCountry: "DK",
    });
    expect(r).toEqual({ locale: "SE", source: "accept-language" });
  });

  test("IP wins when Accept-Language has no Nordic match", () => {
    const r = detectLocale({
      cookie: null,
      acceptLanguage: "en-US,en;q=0.9",
      ipCountry: "SE",
    });
    expect(r).toEqual({ locale: "SE", source: "ip" });
  });

  test("default when nothing is present", () => {
    const r = detectLocale({});
    expect(r).toEqual({ locale: "SE", source: "default" });
  });

  test("default when all signals are empty strings", () => {
    const r = detectLocale({
      cookie: "",
      acceptLanguage: "",
      ipCountry: "",
    });
    expect(r).toEqual({ locale: "SE", source: "default" });
  });

  test("cookie with unsupported value falls through to Accept-Language", () => {
    const r = detectLocale({
      cookie: "XX",
      acceptLanguage: "sv",
      ipCountry: "DK",
    });
    expect(r).toEqual({ locale: "SE", source: "accept-language" });
  });

  test("cookie value is case-insensitive (lowercase accepted)", () => {
    const r = detectLocale({
      cookie: "no",
      acceptLanguage: "sv-SE",
      ipCountry: "DK",
    });
    expect(r).toEqual({ locale: "NO", source: "cookie" });
  });

  test("IP with unsupported country falls through to default", () => {
    const r = detectLocale({
      cookie: null,
      acceptLanguage: "ko-KR,ko",
      ipCountry: "BR",
    });
    expect(r).toEqual({ locale: "SE", source: "default" });
  });
});

describe("detectLocale Accept-Language q-value prioritisation", () => {
  test("Nordic language with higher q wins among Nordic tags", () => {
    const r = detectLocale({
      acceptLanguage: "sv;q=0.7,da;q=0.9",
    });
    expect(r).toEqual({ locale: "DK", source: "accept-language" });
  });

  test("non-Nordic high-q is skipped in favour of Nordic lower-q", () => {
    // Per spec: "första nordiska match" in q-priority order.
    // en (q=0.9) is not Nordic → skip. sv (q=0.8) is Nordic → return SE.
    const r = detectLocale({
      acceptLanguage: "en;q=0.9,sv;q=0.8",
    });
    expect(r).toEqual({ locale: "SE", source: "accept-language" });
  });

  test("tags without q default to 1.0", () => {
    // sv is implicit q=1.0, da is q=0.9 → SE wins
    const r = detectLocale({
      acceptLanguage: "sv,da;q=0.9",
    });
    expect(r).toEqual({ locale: "SE", source: "accept-language" });
  });

  test("malformed q value is treated as 1.0 (not as garbage)", () => {
    const r = detectLocale({
      acceptLanguage: "sv;q=abc,da;q=0.5",
    });
    expect(r).toEqual({ locale: "SE", source: "accept-language" });
  });
});

describe("detectLocale Accept-Language variants", () => {
  test("sv-SE → SE", () => {
    const r = detectLocale({ acceptLanguage: "sv-SE" });
    expect(r).toEqual({ locale: "SE", source: "accept-language" });
  });

  test("sv-FI → FI (Swedish-speaking Finn lands on FI, not SE)", () => {
    const r = detectLocale({ acceptLanguage: "sv-FI,sv;q=0.9" });
    expect(r).toEqual({ locale: "FI", source: "accept-language" });
  });

  test("en-SE → SE (English-speaker in Sweden still gets SE)", () => {
    const r = detectLocale({ acceptLanguage: "en-SE,en;q=0.9" });
    expect(r).toEqual({ locale: "SE", source: "accept-language" });
  });

  test("da-DK → DK", () => {
    const r = detectLocale({ acceptLanguage: "da-DK,da;q=0.9" });
    expect(r).toEqual({ locale: "DK", source: "accept-language" });
  });

  test("nb-NO → NO (Norwegian Bokmål)", () => {
    const r = detectLocale({ acceptLanguage: "nb-NO,nb;q=0.9,no;q=0.8" });
    expect(r).toEqual({ locale: "NO", source: "accept-language" });
  });

  test("nn → NO (Norwegian Nynorsk, no region suffix)", () => {
    const r = detectLocale({ acceptLanguage: "nn" });
    expect(r).toEqual({ locale: "NO", source: "accept-language" });
  });

  test("fi → FI", () => {
    const r = detectLocale({ acceptLanguage: "fi-FI,fi" });
    expect(r).toEqual({ locale: "FI", source: "accept-language" });
  });
});

describe("detectLocale case-insensitivity", () => {
  test("upper- and mixed-case Accept-Language tags are normalised", () => {
    const r = detectLocale({ acceptLanguage: "SV-SE,Sv;Q=0.9" });
    expect(r).toEqual({ locale: "SE", source: "accept-language" });
  });

  test("IP country code accepts lowercase input", () => {
    const r = detectLocale({ ipCountry: "se" });
    expect(r).toEqual({ locale: "SE", source: "ip" });
  });
});

describe("detectLocale edge cases", () => {
  test("Accept-Language with only weights ('q=' garbage) doesn't crash", () => {
    const r = detectLocale({ acceptLanguage: ";q=0.5,;q=0.3" });
    expect(r).toEqual({ locale: "SE", source: "default" });
  });

  test("very long Accept-Language list with Nordic at the end still matches", () => {
    const r = detectLocale({
      acceptLanguage:
        "en-US,en;q=0.9,fr;q=0.8,de;q=0.7,es;q=0.6,it;q=0.5,sv;q=0.4",
    });
    expect(r).toEqual({ locale: "SE", source: "accept-language" });
  });

  test("DE country code from IP returns DE (supported but non-Nordic)", () => {
    const r = detectLocale({ ipCountry: "DE" });
    expect(r).toEqual({ locale: "DE", source: "ip" });
  });

  test("BR (non-supported) IP falls through to default", () => {
    const r = detectLocale({ ipCountry: "BR" });
    expect(r).toEqual({ locale: "SE", source: "default" });
  });

  test("IP wins when AL is whitespace only", () => {
    const r = detectLocale({ acceptLanguage: "   ", ipCountry: "DK" });
    expect(r).toEqual({ locale: "DK", source: "ip" });
  });
});

describe("detectLocale regression — Malmö Telia mobile bug 2026-05-13", () => {
  test("Swedish phone routing through Copenhagen IP returns SE", () => {
    // Reported by user: mobil-IP i Malmö resolverar till DK eftersom
    // Telia/Telenor routar genom Köpenhamn. Desktop på fast bredband
    // får SE. Phone system language: sv.
    const r = detectLocale({
      cookie: null,
      acceptLanguage: "sv-SE,sv;q=0.9,en;q=0.8",
      ipCountry: "DK",
    });
    expect(r.locale).toBe("SE");
    expect(r.source).toBe("accept-language");
  });

  test("Same phone with explicit DK cookie respects user choice", () => {
    // If user actively picks DK (e.g. for shipping reasons), the cookie
    // overrides the language signal.
    const r = detectLocale({
      cookie: "DK",
      acceptLanguage: "sv-SE,sv;q=0.9",
      ipCountry: "DK",
    });
    expect(r.locale).toBe("DK");
    expect(r.source).toBe("cookie");
  });
});
