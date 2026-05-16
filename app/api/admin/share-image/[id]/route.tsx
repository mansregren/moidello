import { ImageResponse } from "next/og";
import { fetchOutfitById } from "@/lib/queries";
import { loadAnton, loadInter } from "@/lib/og-fonts";
import { isCurrentUserAdmin } from "@/lib/admin";
import type { Outfit, TaggedItem } from "@/lib/types";

export const runtime = "nodejs";

const SITE_BASE = "https://moidello.com";

// 9:16 (TikTok / Stories). 1080×1920 är standardupplösning som klipps
// rent i alla appar utan extra crop.
const CANVAS_W = 1080;
const CANVAS_H = 1920;

const BG = "#F7F6F3";
const INK = "#1A1A1A";
const INK_MUTED = "rgba(26,26,26,0.55)";

function absUrl(src: string): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return `${SITE_BASE}${src.startsWith("/") ? src : `/${src}`}`;
}

function shortLabel(brand: string, name: string): string {
  const b = brand?.trim() ?? "";
  const n = name?.trim() ?? "";
  const combined = b && n ? `${b} ${n}` : b || n;
  return combined.length > 22 ? `${combined.slice(0, 21).trim()}…` : combined;
}

// --- HERO-variant: outfit + prickar + stor kod i footern ---

const HERO_FRAME_W = 1000;
const HERO_FRAME_H = 1375;
const HERO_FRAME_X = (CANVAS_W - HERO_FRAME_W) / 2;
const HERO_FRAME_Y = 70;

function renderHero(outfit: Outfit) {
  const code = outfit.code ?? "—";
  const imageUrl = absUrl(outfit.image);
  const dots = outfit.tags.map((tag) => ({
    id: tag.id,
    xPx: (tag.x / 100) * HERO_FRAME_W,
    yPx: (tag.y / 100) * HERO_FRAME_H,
    label: shortLabel(tag.brand, tag.name),
    labelRight: tag.x < 50,
  }));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: BG,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter",
        color: INK,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: HERO_FRAME_X,
          top: HERO_FRAME_Y,
          width: HERO_FRAME_W,
          height: HERO_FRAME_H,
          display: "flex",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 24px 60px -20px rgba(26,26,26,0.18)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          width={HERO_FRAME_W}
          height={HERO_FRAME_H}
          style={{
            width: HERO_FRAME_W,
            height: HERO_FRAME_H,
            objectFit: "cover",
          }}
        />
        {dots.map((d) => (
          <div
            key={d.id}
            style={{
              position: "absolute",
              left: d.xPx,
              top: d.yPx,
              display: "flex",
              alignItems: "center",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: "#fff",
                boxShadow: "0 0 12px rgba(0,0,0,0.45)",
                display: "flex",
                flexShrink: 0,
              }}
            />
            {d.label && (
              <div
                style={{
                  position: "absolute",
                  [d.labelRight ? "left" : "right"]: 26,
                  display: "flex",
                  background: "rgba(255,255,255,0.95)",
                  color: INK,
                  padding: "5px 10px",
                  borderRadius: 999,
                  fontSize: 15,
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
                }}
              >
                {d.label}
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: HERO_FRAME_Y + HERO_FRAME_H + 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 20,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: INK_MUTED,
            display: "flex",
          }}
        >
          Outfit Code
        </div>
        <div
          style={{
            fontFamily: "Anton",
            fontSize: 170,
            lineHeight: 0.92,
            letterSpacing: "0.04em",
            color: INK,
            display: "flex",
          }}
        >
          {code}
        </div>
        <div
          style={{
            fontSize: 20,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: INK_MUTED,
            display: "flex",
            marginTop: 2,
          }}
        >
          moidello.com
        </div>
      </div>
    </div>
  );
}

// --- PLAGG-variant: outfit + stor highlight-ring + plagg-info-block ---

const PLAGG_FRAME_W = 1000;
const PLAGG_FRAME_H = 1250;
const PLAGG_FRAME_X = (CANVAS_W - PLAGG_FRAME_W) / 2;
const PLAGG_FRAME_Y = 50;

function formatPrice(tag: TaggedItem): string | null {
  if (!tag.price || tag.price <= 0) return null;
  const currency = (tag.currency ?? "SEK").toUpperCase();
  return `${tag.price.toLocaleString("sv-SE")} ${currency}`;
}

function renderPlagg(outfit: Outfit, focus: TaggedItem) {
  const code = outfit.code ?? "—";
  const imageUrl = absUrl(outfit.image);
  const focusXPx = (focus.x / 100) * PLAGG_FRAME_W;
  const focusYPx = (focus.y / 100) * PLAGG_FRAME_H;
  const price = formatPrice(focus);
  const others = outfit.tags.filter((t) => t.id !== focus.id);

  // Margin garment som eyebrow — versalisera och clean
  const eyebrow = focus.garment ? focus.garment.toUpperCase() : "PLAGG";
  const brand = (focus.brand ?? "").trim() || "—";
  const name = (focus.name ?? "").trim();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: BG,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter",
        color: INK,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: PLAGG_FRAME_X,
          top: PLAGG_FRAME_Y,
          width: PLAGG_FRAME_W,
          height: PLAGG_FRAME_H,
          display: "flex",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 24px 60px -20px rgba(26,26,26,0.18)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          width={PLAGG_FRAME_W}
          height={PLAGG_FRAME_H}
          style={{
            width: PLAGG_FRAME_W,
            height: PLAGG_FRAME_H,
            objectFit: "cover",
          }}
        />

        {/* Övriga prickar — diskreta */}
        {others.map((t) => {
          const ox = (t.x / 100) * PLAGG_FRAME_W;
          const oy = (t.y / 100) * PLAGG_FRAME_H;
          return (
            <div
              key={t.id}
              style={{
                position: "absolute",
                left: ox,
                top: oy,
                width: 16,
                height: 16,
                borderRadius: 999,
                background: "rgba(255,255,255,0.65)",
                boxShadow: "0 0 8px rgba(0,0,0,0.35)",
                transform: "translate(-50%, -50%)",
                display: "flex",
              }}
            />
          );
        })}

        {/* Highlight-ring runt fokus-plagget */}
        <div
          style={{
            position: "absolute",
            left: focusXPx,
            top: focusYPx,
            width: 130,
            height: 130,
            borderRadius: 999,
            border: "6px solid #fff",
            boxShadow:
              "0 0 24px rgba(255,255,255,0.55), 0 0 0 1px rgba(0,0,0,0.18) inset",
            transform: "translate(-50%, -50%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: focusXPx,
            top: focusYPx,
            width: 22,
            height: 22,
            borderRadius: 999,
            background: "#fff",
            boxShadow: "0 0 14px rgba(0,0,0,0.55)",
            transform: "translate(-50%, -50%)",
            display: "flex",
          }}
        />
      </div>

      {/* Info-block under bilden */}
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: PLAGG_FRAME_Y + PLAGG_FRAME_H + 45,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: INK_MUTED,
            display: "flex",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontFamily: "Anton",
            fontSize: 110,
            lineHeight: 0.95,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
            color: INK,
            display: "flex",
            maxWidth: 960,
          }}
        >
          {brand}
        </div>
        {name && (
          <div
            style={{
              fontSize: 34,
              fontWeight: 500,
              color: INK,
              display: "flex",
              maxWidth: 960,
              lineHeight: 1.2,
            }}
          >
            {name.length > 60 ? `${name.slice(0, 59).trim()}…` : name}
          </div>
        )}
        {price && (
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: INK,
              display: "flex",
              marginTop: 4,
            }}
          >
            {price}
          </div>
        )}
      </div>

      {/* Footer — söka koden på moidello.com */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 60,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <div
          style={{
            fontSize: 18,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: INK_MUTED,
            display: "flex",
          }}
        >
          Sök koden
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 14,
          }}
        >
          <div
            style={{
              fontFamily: "Anton",
              fontSize: 64,
              letterSpacing: "0.04em",
              color: INK,
              display: "flex",
            }}
          >
            {code}
          </div>
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: INK_MUTED,
              display: "flex",
            }}
          >
            · moidello.com
          </div>
        </div>
      </div>
    </div>
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isCurrentUserAdmin())) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const variant = url.searchParams.get("variant") ?? "hero";
  const focusTagId = url.searchParams.get("tag");

  const [outfit, anton, inter] = await Promise.all([
    fetchOutfitById(id),
    loadAnton(),
    loadInter(),
  ]);

  if (!outfit) {
    return new Response("Not found", { status: 404 });
  }

  let element: React.ReactElement;
  if (variant === "plagg" && focusTagId) {
    const focus = outfit.tags.find((t) => t.id === focusTagId);
    if (!focus) {
      return new Response("Tag not found", { status: 404 });
    }
    element = renderPlagg(outfit, focus);
  } else {
    element = renderHero(outfit);
  }

  return new ImageResponse(element, {
    width: CANVAS_W,
    height: CANVAS_H,
    fonts: [
      { name: "Anton", data: anton, style: "normal", weight: 400 },
      { name: "Inter", data: inter, style: "normal", weight: 400 },
    ],
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
