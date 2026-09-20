import { ImageResponse } from "next/og";
import { fetchOutfitById } from "@/lib/queries";
import { loadInter } from "@/lib/og-fonts";

export const runtime = "nodejs";

const SITE_BASE = "https://moidello.com";

// TikTok / Stories full-bleed canvas (1080x1920, 9:16).
const TIKTOK_CANVAS = { w: 1080, h: 1920 };
// Pinterest's recommended pin ratio (2:3) at 2x for a sharper download.
const PINTEREST_CANVAS = { w: 2000, h: 3000 };
const BG = "#FFFFFF";
const INK = "#1A1A1A";

// Outfit photos are always cropped to 3:4 at upload (lib/image-resize.ts) —
// contain-fit that ratio onto the white canvas so nothing gets cropped off,
// with the leftover top/bottom filled white instead of TikTok's own black
// letterbox bars.
const PHOTO_RATIO_W = 3;
const PHOTO_RATIO_H = 4;

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const format = new URL(request.url).searchParams.get("format");
  const { w: CANVAS_W, h: CANVAS_H } =
    format === "pinterest" ? PINTEREST_CANVAS : TIKTOK_CANVAS;

  const [outfit, inter] = await Promise.all([
    fetchOutfitById(id),
    loadInter(),
  ]);

  if (!outfit) {
    return new Response("Not found", { status: 404 });
  }

  const scale = Math.min(CANVAS_W / PHOTO_RATIO_W, CANVAS_H / PHOTO_RATIO_H);
  const photoW = PHOTO_RATIO_W * scale;
  const photoH = PHOTO_RATIO_H * scale;
  const photoX = (CANVAS_W - photoW) / 2;
  const photoY = (CANVAS_H - photoH) / 2;
  // Dot/label sizes below are tuned against the TikTok canvas's photo
  // scale (360) — rescale proportionally so higher-res canvases (like
  // Pinterest's 2x) don't end up with tiny-looking markers.
  const sizeScale = scale / Math.min(TIKTOK_CANVAS.w / PHOTO_RATIO_W, TIKTOK_CANVAS.h / PHOTO_RATIO_H);

  const imageUrl = absUrl(outfit.image);
  const dots = outfit.tags.map((tag) => ({
    id: tag.id,
    xPx: photoX + (tag.x / 100) * photoW,
    yPx: photoY + (tag.y / 100) * photoH,
    label: shortLabel(tag.brand, tag.name),
    labelRight: tag.x < 50,
  }));

  const element = (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: BG,
        display: "flex",
        fontFamily: "Inter",
        color: INK,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: photoX,
          top: photoY,
          width: photoW,
          height: photoH,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          width={photoW}
          height={photoH}
          style={{
            width: photoW,
            height: photoH,
            objectFit: "cover",
          }}
        />
        {dots.map((d) => (
          <div
            key={d.id}
            style={{
              position: "absolute",
              left: d.xPx - photoX,
              top: d.yPx - photoY,
              display: "flex",
              alignItems: "center",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              style={{
                width: 22 * sizeScale,
                height: 22 * sizeScale,
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
                  [d.labelRight ? "left" : "right"]: 26 * sizeScale,
                  display: "flex",
                  background: "rgba(255,255,255,0.95)",
                  color: INK,
                  padding: `${5 * sizeScale}px ${10 * sizeScale}px`,
                  borderRadius: 999,
                  fontSize: 15 * sizeScale,
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
    </div>
  );

  return new ImageResponse(element, {
    width: CANVAS_W,
    height: CANVAS_H,
    fonts: [{ name: "Inter", data: inter, style: "normal", weight: 400 }],
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
