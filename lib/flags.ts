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

/**
 * DAM_PUBLIC — while `false` the Dam (women's) gender filter is ADMIN-ONLY.
 * The public site is Herr-only: the Dam/Herr toggle is hidden, viewer
 * gender is forced to "herr" server- and client-side, /typ/dam/* 404s and
 * is dropped from the sitemap. Dam outfits stay in the database untouched
 * so nothing is lost — logged-in admins still get the toggle to review and
 * manage them. Flip to `true` to relaunch Dam publicly.
 */
export const DAM_PUBLIC = false;

/** Whether the Dam gender filter is available to this viewer. */
export function damVisible(isAdmin: boolean): boolean {
  return DAM_PUBLIC || isAdmin;
}

/**
 * OUTFIT_CREATE_PUBLIC — while `false` publishing outfits is ADMIN-ONLY.
 * The "Skapa" nav entry is hidden for non-admins, /skapa redirects them
 * away, and the createOutfit server action rejects them. Signup, browsing,
 * saving and following are unaffected. Flip to `true` to reopen creator
 * uploads to every logged-in user.
 */
export const OUTFIT_CREATE_PUBLIC = false;

/** Whether this viewer may publish outfits. */
export function canCreateOutfits(isAdmin: boolean): boolean {
  return OUTFIT_CREATE_PUBLIC || isAdmin;
}
