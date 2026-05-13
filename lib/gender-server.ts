import { cookies } from "next/headers";
import type { GenderFilter } from "./types";

const COOKIE = "moidello_gender_pref";

/**
 * Server-side helper. Reads the gender-preference cookie and returns
 * a valid GenderFilter, defaulting to "dam". Use in page.tsx and
 * server actions when you want to apply the user's gender preference
 * server-side (e.g. SQL filter on outfits.gender).
 */
export async function getViewerGender(): Promise<GenderFilter> {
  const jar = await cookies();
  const v = jar.get(COOKIE)?.value;
  return v === "herr" ? "herr" : "dam";
}
