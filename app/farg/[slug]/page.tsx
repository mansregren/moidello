import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd } from "@/lib/json-ld";
import { slugify } from "@/lib/slug";
import {
  fetchOutfitsByColor,
  fetchEngagementForViewer,
} from "@/lib/queries";
import { getViewerGender } from "@/lib/gender-server";

export const dynamic = "force-dynamic";

function slugToColor(slug: string): string {
  const lower = slug.toLowerCase();
  if (!lower) return "";
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default async function FargPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const color = slugToColor(slug);
  if (!color) notFound();

  const gender = await getViewerGender();
  const outfits = await fetchOutfitsByColor(color, gender);
  if (outfits.length === 0) notFound();

  const { liked, saved } = await fetchEngagementForViewer(
    outfits.map((o) => o.id),
  );

  const colorLower = color.toLowerCase();
  const heading = `${color}a outfits`;
  const intro = `Outfit-inspiration med ${colorLower}a plagg från svenska kreatörer. ${outfits.length} stylade looks att hämta idéer från.`;

  return (
    <>
      <Header />
      <JsonLd
        data={collectionPageJsonLd({
          path: `/farg/${slugify(color)}`,
          name: heading,
          description: intro,
          outfits,
        })}
      />
      <main id="main" tabIndex={-1} className="flex-1 pt-6 md:pt-10">
        <Container>
          <nav
            aria-label="Brödsmulor"
            className="text-xs text-foreground-subtle mb-6"
          >
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Moidello
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/upptack" className="hover:text-foreground">
                  Outfits
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground">{color}</li>
            </ol>
          </nav>

          <Link
            href="/upptack"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Alla outfits
          </Link>

          <div className="mb-12 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-foreground-subtle mb-3">
              Färg
            </p>
            <h1 className="font-heading text-[44px] md:text-[72px] leading-[0.95] uppercase tracking-[-0.02em] text-foreground">
              {heading}
            </h1>
            <p className="mt-4 text-lg text-foreground-muted">{intro}</p>
          </div>

          <OutfitGrid outfits={outfits} columns={3} liked={liked} saved={saved} />
        </Container>
      </main>
    </>
  );
}
