import { ImageResponse } from "next/og";
import { fetchOutfitById } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { loadAnton, loadInter } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamic per-outfit alt-text so og:image:alt is descriptive instead of
 * the generic "Outfit på Moidello". Mirrors the auto-description in
 * generateMetadata so screen readers + crawlers get consistent copy.
 */
export async function generateImageMetadata({
  params,
}: {
  params: { id: string };
}) {
  // Public client (no cookies) — generateImageMetadata runs at build time
  // and during static generation; the cookie-based server client throws.
  const outfit = await fetchOutfitById(params.id, createPublicClient());
  if (!outfit) {
    return [{ id: "default", alt: "Moidello", contentType, size }];
  }
  const top = outfit.tags
    .slice(0, 3)
    .map((t) => `${t.brand} ${t.name}`)
    .join(", ");
  const altText = top
    ? `${outfit.title} av ${outfit.creator.displayName} — ${top}`
    : `${outfit.title} av ${outfit.creator.displayName}`;
  return [{ id: "default", alt: altText, contentType, size }];
}

export default async function Image({
  params,
}: {
  params: { id: string };
}) {
  const [outfit, antonFont, interFont] = await Promise.all([
    fetchOutfitById(params.id, createPublicClient()),
    loadAnton(),
    loadInter(),
  ]);

  // If the outfit doesn't exist, fall through to a generic Moidello card
  // so a stray /outfit/<bad-id> share doesn't render a broken image.
  if (!outfit) {
    return fallback(antonFont, interFont);
  }

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
        {/* Outfit photo as background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={outfit.image}
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
        {/* Dark gradient overlay so the text stays readable */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.65) 80%, rgba(0,0,0,0.85) 100%)",
            display: "flex",
          }}
        />

        {/* Top: tag-count chip */}
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
          {outfit.tags.length} {outfit.tags.length === 1 ? "plagg" : "plagg"}
        </div>

        {/* Title */}
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

        {/* Bottom-left: creator strip */}
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
              src={outfit.creator.avatar}
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
            <span style={{ fontSize: 14, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
              Av kreatör
            </span>
            <span style={{ fontSize: 32, fontWeight: 600, marginTop: 2 }}>
              {outfit.creator.displayName}
            </span>
          </div>
        </div>

        {/* Bottom-right: watermark */}
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
      ...size,
      fonts: [
        { name: "Anton", data: antonFont, style: "normal", weight: 400 },
        { name: "Inter", data: interFont, style: "normal", weight: 400 },
      ],
    },
  );
}

function fallback(antonFont: ArrayBuffer, interFont: ArrayBuffer) {
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
      ...size,
      fonts: [
        { name: "Anton", data: antonFont, style: "normal", weight: 400 },
        { name: "Inter", data: interFont, style: "normal", weight: 400 },
      ],
    },
  );
}
