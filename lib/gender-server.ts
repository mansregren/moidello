import { cookies } from "next/headers";
import type { GenderFilter } from "./types";
import { damVisible } from "./flags";

const COOKIE = "moidello_gender_pref";

/**
 * Server-side helper. Reads the gender-preference cookie and returns
 * a valid GenderFilter, defaulting to "dam". Use in page.tsx and
 * server actions when you want to apply the user's gender preference
 * server-side (e.g. SQL filter on outfits.gender).
 *
 * While DAM_PUBLIC is off, non-admin viewers are forced to "herr"
 * regardless of the cookie. Pass the viewer's admin flag so admins can
 * still review Dam content server-side.
 */
export async function getViewerGender(isAdmin = false): Promise<GenderFilter> {
  if (!damVisible(isAdmin)) return "herr";
  const jar = await cookies();
  const v = jar.get(COOKIE)?.value;
  return v === "herr" ? "herr" : "dam";
}
