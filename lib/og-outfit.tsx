import { ImageResponse } from "next/og";
import type { Outfit } from "@/lib/types";

const SITE_BASE = "https://moidello.com";
const SIZE = { width: 1200, height: 630 } as const;

function absUrl(src: string): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return `${SITE_BASE}${src.startsWith("/") ? src : `/${src}`}`;
}

/**
 * Shared 1200×630 outfit OG image. Used by both the legacy
 * /outfit/[id]/opengraph-image route and the new
 * /[username]/[slug]/opengraph-image route so the visual treatment
 * stays in one place.
 */
export function renderOutfitOg(
  outfit: Outfit,
  fonts: { anton: ArrayBuffer; inter: ArrayBuffer },
) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          background: "#000",
          color: "#fff",
          fontFamily: "Inter",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={absUrl(outfit.image)}
          alt=""
          width={1200}
          height={630}
          style={{
            position: "absolute",
            inset: 0,
            objectFit: "cover",
            width: "100%",
            height: "100%",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.65) 80%, rgba(0,0,0,0.85) 100%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 56,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 999,
            padding: "10px 18px",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {outfit.tags.length} plagg
        </div>
        <div
          style={{
            position: "absolute",
            top: 130,
            left: 56,
            right: 56,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <p
            style={{
              fontSize: 22,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)",
              margin: 0,
            }}
          >
            Moidello · Outfit
          </p>
          <h1
            style={{
              fontFamily: "Anton",
              fontSize: outfit.title.length > 28 ? 96 : 128,
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              margin: 0,
              color: "#fff",
              maxWidth: 960,
            }}
          >
            {outfit.title}
          </h1>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 56,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {outfit.creator.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={absUrl(outfit.creator.avatar)}
              alt=""
              width={64}
              height={64}
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.4)",
              }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                background: "rgba(255,255,255,0.1)",
                border: "2px solid rgba(255,255,255,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Anton",
                fontSize: 28,
              }}
            >
              {outfit.creator.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 14,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Av kreatör
            </span>
            <span style={{ fontSize: 32, fontWeight: 600, marginTop: 2 }}>
              {outfit.creator.displayName}
            </span>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 56,
            right: 56,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: "Anton",
              fontSize: 36,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: "#fff",
            }}
          >
            Moidello
          </span>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
            moidello.com
          </span>
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts: [
        { name: "Anton", data: fonts.anton, style: "normal", weight: 400 },
        { name: "Inter", data: fonts.inter, style: "normal", weight: 400 },
      ],
    },
  );
}

export function renderOutfitOgFallback(fonts: {
  anton: ArrayBuffer;
  inter: ArrayBuffer;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Anton",
        }}
      >
        <div
          style={{
            fontSize: 220,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          Moidello
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#999",
            marginTop: 24,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontFamily: "Inter",
          }}
        >
          Inspiration för varje outfit
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts: [
        { name: "Anton", data: fonts.anton, style: "normal", weight: 400 },
        { name: "Inter", data: fonts.inter, style: "normal", weight: 400 },
      ],
    },
  );
}

export function buildOutfitOgAlt(outfit: Outfit): string {
  const top = outfit.tags
    .slice(0, 3)
    .map((t) => `${t.brand} ${t.name}`)
    .join(", ");
  return top
    ? `${outfit.title} av ${outfit.creator.displayName} — ${top}`
    : `${outfit.title} av ${outfit.creator.displayName}`;
}
