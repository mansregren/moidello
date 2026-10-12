// POST /api/admin/items/preview-from-url
//
// Admin-only. Tar en produkt-URL och returnerar struktur:erad ProductMeta
// (brand, namn, pris, valuta, färg, bild, retailer-id, locale, affiliate-
// info). 24h LRU-cache in-memory. Fail-soft — saknad data ⇒ null fält,
// inte HTTP-fel.

import { NextResponse } from "next/server";
import { isHostnameSafe, previewProduct } from "@/lib/retailers/preview";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  // Vem som helst inloggad får använda preview — /skapa behöver samma
  // autofyll-flöde som admin-editorn. Skyddet vi förlitar oss på:
  // rate-limit per användare (10/min), SSRF-validering på hostname/IP,
  // 5 s timeout, 1.5 MB HTML-cap. Routen returnerar bara OG-data som
  // användaren ändå kan se i sin webbläsares dev-tools.
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in." },
      { status: 401 },
    );
  }

  // Rate-limit per user. Limit: 10/min.
  const rateKey = user.id;
  const rl = await checkRateLimit("preview", rateKey);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Wait a moment." },
      {
        status: 429,
        headers: rl.retryAfter
          ? { "retry-after": String(rl.retryAfter) }
          : undefined,
      },
    );
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON." }, { status: 400 });
  }

  const raw = typeof body.url === "string" ? body.url.trim() : "";
  if (!raw) {
    return NextResponse.json({ error: "Saknar url." }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(raw);
    if (!/^https?:$/i.test(url.protocol)) throw new Error();
  } catch {
    return NextResponse.json(
      { error: "Invalid URL — must start with http(s)." },
      { status: 400 },
    );
  }

  if (!(await isHostnameSafe(url.hostname))) {
    return NextResponse.json(
      { error: "The URL points to an internal or disallowed address." },
      { status: 400 },
    );
  }

  return NextResponse.json(await previewProduct(url));
}
