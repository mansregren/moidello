import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Moidello";

async function loadAnton(): Promise<ArrayBuffer> {
  // Satori needs TTF; Google Fonts CSS endpoint serves WOFF2 to modern UAs.
  // Use the upstream Google Fonts repo on GitHub which always serves the TTF.
  const res = await fetch(
    "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf"
  );
  if (!res.ok) throw new Error(`Failed to load Anton: ${res.status}`);
  return res.arrayBuffer();
}

export default async function Image() {
  const antonFont = await loadAnton();

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
            fontSize: 260,
            letterSpacing: "-6px",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          Moidello
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Anton",
          data: antonFont,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
