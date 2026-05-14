import { cookies } from "next/headers";
import type { Theme } from "./theme-context";

const COOKIE = "moidello_theme";

/**
 * Server-side helper. Reads the theme-preference cookie and returns a
 * valid Theme, defaulting to "dark" (dark is still the canonical theme;
 * light is opt-in). Use in app/layout.tsx so SSR sets the right
 * `data-theme` on <html> and there's no flash on first paint.
 */
export async function getViewerTheme(): Promise<Theme> {
  const jar = await cookies();
  const v = jar.get(COOKIE)?.value;
  return v === "light" ? "light" : "dark";
}
