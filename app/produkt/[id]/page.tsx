import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Tag } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/layout/Container";
import { OutfitGrid } from "@/components/outfit/OutfitGrid";
import { UserAvatar } from "@/components/user/UserAvatar";
import { ShareButton } from "@/components/shared/ShareButton";
import { UserLink } from "@/components/shared/UserLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { produktPageJsonLd } from "@/lib/json-ld";
import { outfitPathFromParts } from "@/lib/outfit-url";
import { slugify } from "@/lib/slug";
import { ProduktSaveAndShare } from "./ProduktSaveAndShare";

function isUsableBuyUrl(url: string | undefined): url is string {
  return !!url && url !== "#" && /^https?:\/\//i.test(url);
}
import {
  fetchTaggedItemById,
  fetchOutfitsByItem,
  fetchEngagementForViewer,
} from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProduktPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await fetchTaggedItemById(id);
  if (!item) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [otherOutfits, savedRow] = await Promise.all([
    fetchOutfitsByItem(item.brand, item.name, item.outfitId),
    user
      ? supabase
          .from("saved_items")
          .select("user_id")
          .eq("user_id", user.id)
          .eq("tagged_item_id", item.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const initiallySaved = !!savedRow.data;

  // Engagement state for the related-outfits grid
  const { liked, saved } = await fetchEngagementForViewer(
    otherOutfits.map((o) => o.id),
  );

  // Build the same item-detail shape ShareToDmSheet expects
  const sourceOutfitOutfits = await fetchOutfitsByItem(
    item.brand,
    item.name,
    // include the source outfit too on the related row for context
    undefined,
  );
  const seenInOutfits = sourceOutfitOutfits.length;

  return (
    <>
      <Header />
      <JsonLd
        data={produktPageJsonLd({
          id: item.id,
          brand: item.brand,
          name: item.name,
          price: item.price,
          currency: item.currency,
          buyUrl: item.buyUrl,
          outfitImage: item.outfitImage,
          outfitId: item.outfitId,
          outfitSlug: item.outfitSlug,
          outfitTitle: item.outfitTitle,
          outfitCreatorUsername: item.creator.username,
          description: item.description,
          material: item.material,
          color: item.color,
          keywords: item.keywords,
        })}
      />
      <main id="main" tabIndex={-1} className="flex-1 pt-6 md:pt-10">
        <Container>
          <Link
            href={outfitPathFromParts(item.creator.username, item.outfitSlug, item.outfitId)}
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Tillbaka till outfit
          </Link>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Item image — outfit photo cropped to the tag's pinned position
                so it acts as a stand-in product shot until per-item images
                are uploaded */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-background-tertiary">
              <Image
                src={item.outfitImage}
                alt={
                  item.altText?.trim() ||
                  `${item.color ? `${item.color.toLowerCase()} ` : ""}${item.garment?.toLowerCase() ?? "plagg"} från ${item.brand} — ${item.name}`
                }
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                style={{
                  objectPosition: `${item.positionX}% ${item.positionY}%`,
                }}
                className="object-cover"
                unoptimized={item.outfitImage.startsWith("http")}
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-foreground-subtle">
                {item.garment}
              </p>
              <h1 className="mt-2 font-heading text-[36px] md:text-[56px] leading-[0.95] uppercase tracking-tight text-foreground">
                <span className="text-foreground/80">{item.brand}</span>
                <br />
                {item.name}
              </h1>

              {item.isAffiliate && (
                <span className="mt-4 inline-flex rounded-full bg-foreground/10 text-foreground-muted px-2 py-0.5 text-[10px] font-semibold tracking-wider">
                  REKLAM
                </span>
              )}

              {item.price > 0 && (
                <p className="mt-6 text-2xl md:text-3xl font-semibold text-foreground tabular-nums">
                  {item.price.toLocaleString("sv-SE")} {item.currency}
                </p>
              )}

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {isUsableBuyUrl(item.buyUrl) && (
                  <UserLink
                    href={`/go/${item.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-sm font-semibold hover:bg-foreground/90 transition-colors"
                  >
                    Köp hos {item.brand}
                    <ExternalLink className="h-4 w-4" />
                  </UserLink>
                )}
                <ProduktSaveAndShare
                  itemId={item.id}
                  initiallySaved={initiallySaved}
                  shareTitle={`${item.brand} — ${item.name}`}
                />
                <ShareButton
                  url={`/produkt/${item.id}`}
                  title={`${item.brand} ${item.name}`}
                  text={`${item.brand} ${item.name} på Moidello`}
                  label="Dela länk"
                  variant="outline"
                />
              </div>

              {/* Source outfit / creator strip */}
              <div className="mt-10 pt-6 border-t border-border">
                <p className="text-xs uppercase tracking-wider text-foreground-subtle mb-3">
                  Sett i outfit
                </p>
                <Link
                  href={outfitPathFromParts(item.creator.username, item.outfitSlug, item.outfitId)}
                  aria-label={item.outfitTitle}
                  className="flex items-center gap-3 hover:opacity-90 transition-opacity"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-background-tertiary">
                    <Image
                      src={item.outfitImage}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized={item.outfitImage.startsWith("http")}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.outfitTitle}
                    </p>
                    {item.creator.username && (
                      <Link
                        href={`/profile/${item.creator.username}`}
                        className="flex items-center gap-2 mt-1 text-xs text-foreground-muted hover:text-foreground"
                      >
                        <UserAvatar
                          src={item.creator.avatarUrl ?? ""}
                          alt=""
                          size="sm"
                          className="!h-5 !w-5"
                        />
                        @{item.creator.username}
                      </Link>
                    )}
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Long-form content + structured facts. Renders when AI-backfill
              has populated the new SEO fields (migration 0036). Skipped
              entirely if there's nothing to say, so unbackfilled items
              don't render a sad-empty block. */}
          {(item.description ||
            item.material ||
            item.color ||
            (item.keywords && item.keywords.length > 0)) && (
            <section className="mt-16 md:mt-20 max-w-3xl">
              {item.description && (
                <>
                  <h2 className="text-xs uppercase tracking-[0.25em] text-foreground-subtle mb-3">
                    Om plagget
                  </h2>
                  <p className="text-foreground/90 leading-relaxed text-[15px] md:text-base whitespace-pre-line">
                    {item.description}
                  </p>
                </>
              )}

              <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-foreground-subtle">
                    Märke
                  </dt>
                  <dd className="mt-1 text-foreground font-medium">
                    <Link
                      href={`/brand/${item.brand.toLowerCase()}`}
                      className="hover:underline underline-offset-4"
                    >
                      {item.brand}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-foreground-subtle">
                    Kategori
                  </dt>
                  <dd className="mt-1 text-foreground font-medium capitalize">
                    {item.garment?.toLowerCase() ?? "—"}
                  </dd>
                </div>
                {item.color && (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-foreground-subtle">
                      Färg
                    </dt>
                    <dd className="mt-1 text-foreground font-medium capitalize">
                      <Link
                        href={`/farg/${slugify(item.color)}`}
                        className="hover:underline underline-offset-4"
                      >
                        {item.color}
                      </Link>
                    </dd>
                  </div>
                )}
                {item.material && (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-foreground-subtle">
                      Material
                    </dt>
                    <dd className="mt-1 text-foreground font-medium capitalize">
                      {item.material}
                    </dd>
                  </div>
                )}
              </dl>

              {item.keywords && item.keywords.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-[11px] uppercase tracking-wider text-foreground-subtle mb-3">
                    Nyckelord
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {item.keywords.slice(0, 10).map((kw) => (
                      <li key={kw}>
                        <Link
                          href={`/sok?q=${encodeURIComponent(kw)}`}
                          className="inline-block rounded-full border border-border bg-background-secondary px-3 py-1 text-xs text-foreground-muted hover:text-foreground hover:border-foreground/40 transition-colors"
                        >
                          {kw}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Other outfits styling this item */}
          <section className="mt-16 md:mt-24 mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Tag className="h-4 w-4 text-foreground-muted" />
              <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider">
                Stylas i {seenInOutfits}{" "}
                {seenInOutfits === 1 ? "outfit" : "outfits"}
              </h2>
            </div>
            {otherOutfits.length > 0 ? (
              <OutfitGrid
                outfits={otherOutfits}
                columns={3}
                liked={liked}
                saved={saved}
              />
            ) : (
              <p className="text-sm text-foreground-muted">
                Plagget syns hittills bara i{" "}
                <Link
                  href={outfitPathFromParts(item.creator.username, item.outfitSlug, item.outfitId)}
                  className="text-foreground border-b border-foreground/30 hover:border-foreground"
                >
                  ursprungsoutfiten
                </Link>
                .
              </p>
            )}
          </section>
        </Container>
      </main>
    </>
  );
}
