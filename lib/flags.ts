/**
 * Feature flags.
 *
 * HOME_VERTICAL_PUBLIC — the heminredning vertical (/home). While `false`
 * it's ADMIN-ONLY: admins see the Hem toggle, /home and /home/[rum] so
 * they can seed content; the public sees nothing — no toggle pill, a 404
 * on the routes, absent from sitemap + llms.txt, and noindex. Flip to
 * `true` to launch it to everyone (also re-adds it to sitemap/llms).
 */
export const HOME_VERTICAL_PUBLIC = false;

/** Whether the home vertical should be visible to this viewer. */
export function homeVerticalVisible(isAdmin: boolean): boolean {
  return HOME_VERTICAL_PUBLIC || isAdmin;
}
