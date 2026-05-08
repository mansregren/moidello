import { ImageResponse } from "next/og";
import {
  fetchProfileByUsername,
  fetchOutfitsByUser,
} from "@/lib/queries";
import { loadAnton, loadInter } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Profil på Moidello";

export default async function Image({
  params,
}: {
  params: { username: string };
}) {
  const [user, antonFont, interFont] = await Promise.all([
    fetchProfileByUsername(params.username),
    loadAnton(),
    loadInter(),
  ]);

  if (!user) {
    return brandFallback(antonFont, interFont);
  }

  const outfits = (await fetchOutfitsByUser(user.id)).slice(0, 4);
  const collageImages = outfits.map((o) => o.image);

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
        {/* Left side: identity + stats (560 wide) */}
        <div
          style={{
            width: 560,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 56px",
            background:
              "linear-gradient(160deg, #0a0a0a 0%, #000 60%, #1a1a1a 100%)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <span
              style={{
                fontSize: 18,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Moidello · Profil
            </span>

            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt=""
                width={132}
                height={132}
                style={{
                  width: 132,
                  height: 132,
                  borderRadius: 999,
                  objectFit: "cover",
                  border: "3px solid rgba(255,255,255,0.4)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 132,
                  height: 132,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  border: "3px solid rgba(255,255,255,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Anton",
                  fontSize: 64,
                }}
              >
                {user.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <h1
                style={{
                  fontFamily: "Anton",
                  fontSize: user.displayName.length > 16 ? 72 : 96,
                  lineHeight: 0.95,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  margin: 0,
                  color: "#fff",
                }}
              >
                {user.displayName}
              </h1>
              <p
                style={{
                  fontSize: 28,
                  color: "rgba(255,255,255,0.7)",
                  margin: 0,
                }}
              >
                @{user.username}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 36 }}>
              <Stat label="Outfits" value={user.outfitCount} />
              <Stat label="Följare" value={user.followers} />
              <Stat label="Följer" value={user.following} />
            </div>
            <span
              style={{
                fontFamily: "Anton",
                fontSize: 28,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                color: "#fff",
                marginTop: 8,
              }}
            >
              moidello.com
            </span>
          </div>
        </div>

        {/* Right side: outfit collage (640 wide) */}
        <div
          style={{
            width: 640,
            height: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: 4,
            background: "#0a0a0a",
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => {
            const src = collageImages[i];
            if (src) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              );
            }
            return (
              <div
                key={i}
                style={{
                  background: i % 2 === 0 ? "#0d0d0d" : "#141414",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Anton",
                  fontSize: 36,
                  color: "rgba(255,255,255,0.15)",
                  textTransform: "uppercase",
                  letterSpacing: "-0.02em",
                }}
              >
                Moidello
              </div>
            );
          })}
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontFamily: "Anton", fontSize: 48, lineHeight: 1 }}>
        {value.toLocaleString("sv-SE")}
      </span>
      <span
        style={{
          fontSize: 14,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
          marginTop: 4,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function brandFallback(antonFont: ArrayBuffer, interFont: ArrayBuffer) {
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
