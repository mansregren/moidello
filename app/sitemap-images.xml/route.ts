import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_BASE = "https://moidello.com";
const MAX_OUTFITS = 1000;
const MAX_PROFILES = 500;

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function abs(src: string | null | undefined): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return `${SITE_BASE}${src.startsWith("/") ? src : `/${src}`}`;
}

interface OutfitRow {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string;
  profiles: { username: string; display_name: string | null } | null;
  tagged_items: { brand: string; name: string }[] | null;
}

interface ProfileRow {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

function outfitCaption(o: OutfitRow): string {
  const own = o.description?.trim();
  if (own) return own;
  const top = (o.tagged_items ?? [])
    .slice(0, 3)
    .map((t) => `${t.brand} ${t.name}`)
    .join(", ");
  const creator = o.profiles?.display_name ?? o.profiles?.username ?? "";
  if (top && o.category) {
    return `${o.category}-outfit med ${top}${creator ? ` av ${creator}` : ""}`;
  }
  if (top) return `Outfit med ${top}${creator ? ` av ${creator}` : ""}`;
  return `${o.title}${creator ? ` av ${creator}` : ""}`;
}

export async function GET() {
  const supabase = createPublicClient();

  const [outfitsRes, profilesRes] = await Promise.all([
    supabase
      .from("outfits")
      .select(
        `id, slug, title, description, category, image_url,
         profiles!outfits_user_id_fkey(username, display_name),
         tagged_items(brand, name)`,
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(MAX_OUTFITS),
    supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .not("avatar_url", "is", null)
      .limit(MAX_PROFILES),
  ]);

  const outfits = ((outfitsRes.data ?? []) as unknown) as OutfitRow[];
  const profiles = ((profilesRes.data ?? []) as unknown) as ProfileRow[];

  const urls: string[] = [];

  for (const o of outfits) {
    if (!o.image_url) continue;
    const username = o.profiles?.username?.toLowerCase();
    const pagePath =
      o.slug && username ? `/${username}/${o.slug}` : `/outfit/${o.id}`;
    const pageUrl = `${SITE_BASE}${pagePath}`;
    const imageUrl = abs(o.image_url);
    const caption = outfitCaption(o);
    urls.push(
      `  <url>\n    <loc>${escapeXml(pageUrl)}</loc>\n` +
        `    <image:image>\n      <image:loc>${escapeXml(imageUrl)}</image:loc>\n` +
        `      <image:title>${escapeXml(o.title)}</image:title>\n` +
        `      <image:caption>${escapeXml(caption)}</image:caption>\n` +
        `    </image:image>\n  </url>`,
    );
  }

  for (const p of profiles) {
    if (!p.avatar_url || !p.username) continue;
    if (p.username.startsWith("user_")) continue; // skip placeholder
    const handle = p.username.toLowerCase();
    const pageUrl = `${SITE_BASE}/profile/${handle}`;
    const imageUrl = abs(p.avatar_url);
    const name = p.display_name ?? p.username;
    urls.push(
      `  <url>\n    <loc>${escapeXml(pageUrl)}</loc>\n` +
        `    <image:image>\n      <image:loc>${escapeXml(imageUrl)}</image:loc>\n` +
        `      <image:title>${escapeXml(name)}</image:title>\n` +
        `      <image:caption>${escapeXml(`${name} — kreatör på Moidello`)}</image:caption>\n` +
        `    </image:image>\n  </url>`,
    );
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    urls.join("\n") +
    (urls.length > 0 ? "\n" : "") +
    `</urlset>\n`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}
