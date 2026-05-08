import { ImageResponse } from "next/og";
import { fetchTaggedItemById } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";
import { loadAnton, loadInter } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Plagg på Moidello";

export default async function Image({
  params,
}: {
  params: { id: string };
}) {
  const [item, antonFont, interFont] = await Promise.all([
    fetchTaggedItemById(params.id, createPublicClient()),
    loadAnton(),
    loadInter(),
  ]);

  const fonts = [
    { name: "Anton", data: antonFont, style: "normal" as const, weight: 400 as const },
    { name: "Inter", data: interFont, style: "normal" as const, weight: 400 as const },
  ];

  if (!item) {
    return new ImageResponse(brandFallbackJsx(), { ...size, fonts });
  }

  const priceLabel =
    item.price > 0
      ? `${item.price.toLocaleString("sv-SE")} ${item.currency}`
      : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#000",
          color: "#fff",
          fontFamily: "Inter",
        }}
      >
        {/* Left: garment thumbnail (outfit photo cropped to tag position) */}
        <div
          style={{
            width: 540,
            height: "100%",
            position: "relative",
            display: "flex",
            background: "#0a0a0a",
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.outfitImage}
            alt=""
            width={540}
            height={630}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: `${item.positionX}% ${item.positionY}%`,
            }}
          />
        </div>

        {/* Right: brand + name + price + CTA */}
        <div
          style={{
            width: 660,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 56px",
            background: "linear-gradient(160deg, #0a0a0a 0%, #000 60%, #1a1a1a 100%)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <span
              style={{
                fontSize: 18,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              Moidello · {item.garment}
            </span>
            <span
              style={{
                fontSize: 28,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {item.brand}
            </span>
            <h1
              style={{
                fontFamily: "Anton",
                fontSize: item.name.length > 26 ? 88 : 110,
                lineHeight: 0.92,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                margin: 0,
                color: "#fff",
              }}
            >
              {item.name}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {priceLabel && (
                <span
                  style={{
                    fontFamily: "Anton",
                    fontSize: 56,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    color: "#fff",
                  }}
                >
                  {priceLabel}
                </span>
              )}
              <span
                style={{
                  fontSize: 16,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 14,
                }}
              >
                moidello.com
              </span>
            </div>
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
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

function brandFallbackJsx() {
  return (
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
  );
}
