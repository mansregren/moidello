"use server";

import { createClient } from "@/lib/supabase/server";

export interface CsvRow {
  name: string;
  description?: string;
  price?: number | null;
  currency?: string | null;
  buy_url?: string | null;
  image_url?: string | null;
}

export interface ImportResult {
  ok: boolean;
  inserted: number;
  skipped: Array<{ row: number; reason: string }>;
  error?: string;
}

// Minimal CSV parser. Handles double-quoted fields (with escaped "" inside),
// trims whitespace around unquoted values, splits on commas otherwise.
// Headers are normalised to lowercase + underscored.
function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      current.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      current.push(field);
      field = "";
      if (current.length > 1 || current[0].trim() !== "") rows.push(current);
      current = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || current.length > 0) {
    current.push(field);
    if (current.length > 1 || current[0].trim() !== "") rows.push(current);
  }

  if (rows.length === 0) return [];
  const header = rows[0].map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "_"),
  );
  return rows.slice(1).map((cols) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => {
      obj[h] = (cols[i] ?? "").trim();
    });
    return obj;
  });
}

const MAX_ROWS = 500;

export async function importProductsCsv(
  csvText: string,
): Promise<ImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, inserted: 0, skipped: [], error: "Inte inloggad." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, brand_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.account_type !== "brand" || !profile.brand_name) {
    return {
      ok: false,
      inserted: 0,
      skipped: [],
      error: "Endast brand-konton kan importera produkter.",
    };
  }

  const parsed = parseCsv(csvText.trim());
  if (parsed.length === 0) {
    return { ok: false, inserted: 0, skipped: [], error: "Tom CSV." };
  }
  if (parsed.length > MAX_ROWS) {
    return {
      ok: false,
      inserted: 0,
      skipped: [],
      error: `Max ${MAX_ROWS} rader per import.`,
    };
  }

  const brandKey = (profile.brand_name as string).toLowerCase();
  const skipped: ImportResult["skipped"] = [];
  const valid: Array<{
    brand_profile_id: string;
    brand_key: string;
    name: string;
    description: string | null;
    price: number | null;
    currency: string | null;
    buy_url: string | null;
    image_url: string | null;
  }> = [];

  parsed.forEach((row, idx) => {
    const name = row.name?.trim();
    if (!name) {
      skipped.push({ row: idx + 2, reason: "Saknar name." });
      return;
    }
    if (name.length > 200) {
      skipped.push({ row: idx + 2, reason: "name för lång (>200)." });
      return;
    }

    const priceRaw = row.price?.replace(",", ".").trim();
    let price: number | null = null;
    if (priceRaw) {
      const p = Number(priceRaw);
      if (!Number.isFinite(p) || p < 0 || p > 9_999_999) {
        skipped.push({
          row: idx + 2,
          reason: "Ogiltigt price (0–9999999).",
        });
        return;
      }
      price = p;
    }

    const buyUrl = row.buy_url?.trim() || null;
    if (buyUrl && !/^https?:\/\//i.test(buyUrl)) {
      skipped.push({ row: idx + 2, reason: "buy_url måste börja med http(s)://" });
      return;
    }

    const imageUrl = row.image_url?.trim() || null;
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      skipped.push({
        row: idx + 2,
        reason: "image_url måste börja med http(s)://",
      });
      return;
    }

    valid.push({
      brand_profile_id: user.id,
      brand_key: brandKey,
      name,
      description: row.description?.trim() || null,
      price,
      currency: row.currency?.trim().toUpperCase() || "SEK",
      buy_url: buyUrl,
      image_url: imageUrl,
    });
  });

  if (valid.length === 0) {
    return {
      ok: false,
      inserted: 0,
      skipped,
      error: "Inga giltiga rader.",
    };
  }

  const { error } = await supabase.from("brand_products").insert(valid);
  if (error) {
    return {
      ok: false,
      inserted: 0,
      skipped,
      error: error.message,
    };
  }

  return { ok: true, inserted: valid.length, skipped };
}

export async function deleteBrandProduct(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inte inloggad." };

  const { error } = await supabase
    .from("brand_products")
    .delete()
    .eq("id", id)
    .eq("brand_profile_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
