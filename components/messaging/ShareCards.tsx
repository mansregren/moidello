"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Tag, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { outfitPathFromParts } from "@/lib/outfit-url";

export interface OutfitShareData {
  outfit_id: string;
}

export interface ItemShareData {
  tagged_item_id: string;
}

interface OutfitPreview {
  id: string;
  slug: string | null;
  title: string;
  image_url: string;
  tag_count: number;
  creator_username: string;
  creator_display_name: string | null;
}

interface ItemPreview {
  id: string;
  brand: string;
  name: string;
  price: number | null;
  currency: string | null;
  buy_url: string | null;
  outfit_id: string;
  outfit_image: string;
}

export function OutfitShareCard({
  data,
  fromMe,
}: {
  data: OutfitShareData;
  fromMe: boolean;
}) {
  const [preview, setPreview] = useState<OutfitPreview | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const { data: row } = await supabase
        .from("outfits")
        .select(
          `id, slug, title, image_url,
           profiles!outfits_user_id_fkey(username, display_name),
           tagged_items(id)`,
        )
        .eq("id", data.outfit_id)
        .maybeSingle();
      if (cancelled) return;
      if (!row) {
        setMissing(true);
        return;
      }
      const r = row as unknown as {
        id: string;
        slug: string | null;
        title: string;
        image_url: string;
        profiles: { username: string; display_name: string | null } | null;
        tagged_items: { id: string }[] | null;
      };
      setPreview({
        id: r.id,
        slug: r.slug,
        title: r.title,
        image_url: r.image_url,
        tag_count: r.tagged_items?.length ?? 0,
        creator_username: r.profiles?.username ?? "",
        creator_display_name: r.profiles?.display_name ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [data.outfit_id]);

  if (missing) {
    return (
      <ShareCardShell fromMe={fromMe}>
        <p className="p-4 text-sm text-foreground-subtle">
          Outfiten är inte längre tillgänglig.
        </p>
      </ShareCardShell>
    );
  }

  if (!preview) {
    return (
      <ShareCardShell fromMe={fromMe}>
        <div className="aspect-[3/4] bg-background-tertiary animate-pulse" />
      </ShareCardShell>
    );
  }

  return (
    <ShareCardShell fromMe={fromMe}>
      <Link
        href={outfitPathFromParts(
          preview.creator_username,
          preview.slug,
          preview.id,
        )}
        className="block"
      >
        <div className="relative aspect-[3/4] bg-background-tertiary">
          <Image
            src={preview.image_url}
            alt=""
            fill
            sizes="280px"
            className="object-cover"
            unoptimized={preview.image_url.startsWith("http")}
          />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium text-white">
            <Tag className="h-3 w-3" />
            {preview.tag_count}
          </span>
        </div>
        <div className="p-3">
          <p className="text-sm font-medium text-white truncate">
            {preview.title}
          </p>
          <p className="text-xs text-foreground-subtle truncate mt-0.5">
            av{" "}
            {preview.creator_display_name ?? `@${preview.creator_username}`}
          </p>
        </div>
      </Link>
    </ShareCardShell>
  );
}

export function ItemShareCard({
  data,
  fromMe,
}: {
  data: ItemShareData;
  fromMe: boolean;
}) {
  const [preview, setPreview] = useState<ItemPreview | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const { data: row } = await supabase
        .from("tagged_items")
        .select(
          "id, brand, name, price, currency, buy_url, outfit_id, outfits(image_url)",
        )
        .eq("id", data.tagged_item_id)
        .maybeSingle();
      if (cancelled) return;
      if (!row) {
        setMissing(true);
        return;
      }
      const r = row as unknown as {
        id: string;
        brand: string;
        name: string;
        price: number | null;
        currency: string | null;
        buy_url: string | null;
        outfit_id: string;
        outfits: { image_url: string } | null;
      };
      setPreview({
        id: r.id,
        brand: r.brand,
        name: r.name,
        price: r.price,
        currency: r.currency,
        buy_url: r.buy_url,
        outfit_id: r.outfit_id,
        outfit_image: r.outfits?.image_url ?? "",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [data.tagged_item_id]);

  if (missing) {
    return (
      <ShareCardShell fromMe={fromMe}>
        <p className="p-4 text-sm text-foreground-subtle">
          Plagget är inte längre tillgängligt.
        </p>
      </ShareCardShell>
    );
  }

  if (!preview) {
    return (
      <ShareCardShell fromMe={fromMe}>
        <div className="h-24 bg-background-tertiary animate-pulse" />
      </ShareCardShell>
    );
  }

  return (
    <ShareCardShell fromMe={fromMe}>
      <Link
        href={`/produkt/${preview.id}`}
        className="flex gap-3 p-3 hover:bg-white/5 transition-colors"
      >
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-background-tertiary">
          {preview.outfit_image && (
            <Image
              src={preview.outfit_image}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
              unoptimized={preview.outfit_image.startsWith("http")}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-foreground-muted truncate">
            {preview.brand}
          </p>
          <p className="text-sm font-medium text-white mt-0.5 line-clamp-2">
            {preview.name}
          </p>
          {preview.price !== null && preview.price > 0 && (
            <p className="text-sm font-semibold text-white mt-1">
              {preview.price.toLocaleString("sv-SE")}{" "}
              {preview.currency ?? "SEK"}
            </p>
          )}
        </div>
      </Link>
      {preview.buy_url &&
        preview.buy_url !== "#" &&
        /^https?:\/\//i.test(preview.buy_url) && (
          <a
            href={preview.buy_url}
            target="_blank"
            rel="ugc nofollow noopener noreferrer"
            className="flex items-center justify-center gap-1.5 border-t border-border py-2 text-xs font-medium text-white hover:bg-white/5"
          >
            Köp
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
    </ShareCardShell>
  );
}

function ShareCardShell({
  fromMe,
  children,
}: {
  fromMe: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`w-72 max-w-full overflow-hidden rounded-2xl border ${
        fromMe ? "border-white/20 bg-white/5" : "border-border bg-background-secondary"
      }`}
    >
      {children}
    </div>
  );
}
