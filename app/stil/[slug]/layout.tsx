import type { Metadata } from "next";
import { fetchOutfitsByCategory } from "@/lib/queries";
import { createPublicClient } from "@/lib/supabase/public";

const SITE = "Moidello";

const STYLES: Record<
  string,
  { label: string; description: string; lead: string }
> = {
  minimalism: {
    label: "Minimalism",
    description:
      "Lugna palletter, rena linjer, neutrala färger. Skandinavisk minimalism med fokus på passform och material.",
    lead: "Lugna palletter och tidlös passform",
  },
  vintage: {
    label: "Vintage",
    description:
      "Retro-inspirerade plagg, second hand och utvalt äldre mode. Stil som åldras snyggt istället för att bytas ut.",
    lead: "Second hand och tidlöst",
  },
  casual: {
    label: "Casual",
    description:
      "Avslappnade vardagsoutfits. Lättburet, bekvämt och praktiskt — utan att tappa stilen.",
    lead: "Vardagliga outfits utan ansträngning",
  },
  streetwear: {
    label: "Streetwear",
    description:
      "Urban stil med sneakers, oversized fits och statement-plagg. Influenser från skate, hiphop och japanska gator.",
    lead: "Urban stil med oversized fits",
  },
  formal: {
    label: "Formal",
    description:
      "Kostym, smarta klänningar och eleganta accessoarer. Outfits för middag, jobb och tillfällen som kräver mer.",
    lead: "Kostym och smarta klänningar",
  },
  sporty: {
    label: "Sporty",
    description:
      "Athleisure och funktionella plagg — träningskläder som funkar utanför gymmet, lätt och rörlig stil.",
    lead: "Athleisure och funktion",
  },
  preppy: {
    label: "Preppy",
    description:
      "East coast-stil med stickade plagg, chinos, loafers och poloskjortor. Klassiskt och oansträngt sofistikerat.",
    lead: "East coast-klassiker",
  },
};

function resolveStyle(slug: string) {
  return STYLES[slug.toLowerCase()] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const style = resolveStyle(slug);
  if (!style) {
    return {
      title: "Stil",
      robots: { index: false, follow: true },
    };
  }

  const outfits = await fetchOutfitsByCategory(
    style.label,
    undefined,
    createPublicClient(),
  );

  if (outfits.length === 0) {
    return {
      title: `${style.label} — outfit-inspiration`,
      description: `Inga ${style.label.toLowerCase()}-outfits ännu på ${SITE}.`,
      robots: { index: false, follow: true },
    };
  }

  const title = `${style.label} — ${outfits.length} outfit-idéer`;
  const description = `${style.description} Bläddra ${outfits.length} stylade outfits inom ${style.label.toLowerCase()} från svenska kreatörer på ${SITE}.`;

  return {
    title,
    description,
    alternates: { canonical: `/stil/${slug.toLowerCase()}` },
    openGraph: {
      title,
      description,
      url: `/stil/${slug.toLowerCase()}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function StilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
