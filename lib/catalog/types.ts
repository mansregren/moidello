import type { Gender } from "@/lib/garments";

/** A plaggbank row as the admin UIs see it. */
export interface CatalogItem {
  id: string;
  brand: string;
  name: string;
  garment: string;
  gender: Gender | null;
  color: string | null;
  material: string | null;
  price: number | null;
  currency: string;
  buyUrl: string | null;
  imageUrl: string;
  imageBg: string | null;
  retailer: string | null;
  isAffiliate: boolean;
  isArchived: boolean;
  createdAt: string;
  /** Number of outfit tags that point at this item. */
  usage: number;
}

/** An unsaved item from the paste-URL flow, editable before saving. */
export interface CatalogDraft {
  url: string;
  brand: string;
  name: string;
  garment: string;
  gender: Gender | null;
  color: string;
  material: string;
  price: number | null;
  currency: string;
  sourceImageUrl: string;
  retailer: string | null;
  retailerLocale: string | null;
  isAffiliate: boolean;
  affiliateNetwork: string | null;
  /** Set when the URL is already in the bank. */
  duplicateOf: { id: string; name: string } | null;
  /** Fetch problem worth showing ("no product data found" etc). */
  warning: string | null;
}

export const CATALOG_SELECT =
  "id, brand, name, garment, gender, color, material, price, currency, buy_url, image_url, image_bg, retailer, is_affiliate, is_archived, created_at";

export interface CatalogRow {
  id: string;
  brand: string;
  name: string;
  garment: string;
  gender: Gender | null;
  color: string | null;
  material: string | null;
  price: number | null;
  currency: string;
  buy_url: string | null;
  image_url: string;
  image_bg: string | null;
  retailer: string | null;
  is_affiliate: boolean;
  is_archived: boolean;
  created_at: string;
}

export function toCatalogItem(row: CatalogRow, usage = 0): CatalogItem {
  return {
    id: row.id,
    brand: row.brand,
    name: row.name,
    garment: row.garment,
    gender: row.gender,
    color: row.color,
    material: row.material,
    price: row.price,
    currency: row.currency,
    buyUrl: row.buy_url,
    imageUrl: row.image_url,
    imageBg: row.image_bg,
    retailer: row.retailer,
    isAffiliate: row.is_affiliate,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    usage,
  };
}
