import { ImageResponse } from "next/og";
import { fetchOutfitById } from "@/lib/queries";
import { loadAnton, loadInter } from "@/lib/og-fonts";
import { isCurrentUserAdmin } from "@/lib/admin";

export const runtime = "nodejs";

const SITE_BASE = "https://moidello.com";

// 9:16 (TikTok / Stories). 1080×1920 är standardupplösning som klipps
// rent i alla appar utan extra crop.
const CANVAS_W = 1080;
const CANVAS_H = 1920;

// Inner outfit-frame matchar sajtens 800×1100-cover (≈ 8:11). Stor frame
// med smal sidomarginal så det vita utrymmet på canvas minimeras.
const FRAME_W = 1000;
const FRAME_H = 1375;
const FRAME_X = (CANVAS_W - FRAME_W) / 2;
const FRAME_Y = 70;

const BG = "#F7F6F3"; // Moidello kräm/off-white
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isCurrentUserAdmin())) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const [outfit, anton, inter] = await Promise.all([
    fetchOutfitById(id),
    loadAnton(),
    loadInter(),
  ]);

  if (!outfit) {
    return new Response("Not found", { status: 404 });
  }

  const code = outfit.code ?? "—";
  const imageUrl = absUrl(outfit.image);

  const dots = outfit.tags.map((tag) => {
    const xPx = (tag.x / 100) * FRAME_W;
    const yPx = (tag.y / 100) * FRAME_H;
    const labelRight = tag.x < 50;
    return {
      id: tag.id,
      xPx,
      yPx,
      label: shortLabel(tag.brand, tag.name),
      labelRight,
    };
  });

  return new ImageResponse(
    (
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
        {/* Outfit-frame */}
        <div
          style={{
            position: "absolute",
            left: FRAME_X,
            top: FRAME_Y,
            width: FRAME_W,
            height: FRAME_H,
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
            width={FRAME_W}
            height={FRAME_H}
            style={{
              width: FRAME_W,
              height: FRAME_H,
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

        {/* Footer: outfit-kod + moidello.com — packad nära bildens
            underkant så det inte blir för mycket vitt */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: FRAME_Y + FRAME_H + 40,
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
    ),
    {
      width: CANVAS_W,
      height: CANVAS_H,
      fonts: [
        { name: "Anton", data: anton, style: "normal", weight: 400 },
        { name: "Inter", data: inter, style: "normal", weight: 400 },
      ],
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
