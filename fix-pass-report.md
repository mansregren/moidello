# Moidello Fix-pass — Status-rapport

Genererad automatiskt av Claude under det 6-fas-fix-pass som spec:ades 2026-05-13.
Varje fas committas + pushas + verifieras mot prod innan nästa startar.

---

## Fas 1 — KLAR ✓

- **Commit:** `c6fabf0`
- **Pushad till origin/main:** ja
- **Vercel deploy:** `moidello-kqs3c5oj5...` Ready (1m build)
- **moidello.com:** HTTP 200, CSP-Report-Only-header verifierad live
- **npm audit:** 0 high / 0 critical (2 moderate postcss kvarstår — inte fixbara utan downgrade)

### Vad som ändrats
- **S-1:** `next 16.2.4 → 16.2.6` via `npm audit fix --force`
- **S-2:** `app/api/admin/items/preview-from-url/route.ts` har nu `isHostnameSafe()` med DNS-resolve + IP-range blocklist (127/8, 10/8, 172.16/12, 192.168/16, 169.254/16, CGNAT, multicast, IPv6 link-local/ULA, `::1`, `::ffff:` mapped). Blockerar också `localhost`, `*.local`, `*.internal`, `metadata.google.internal` vid namn. Returnerar 400.
- **S-5:** `next.config.ts` har `async headers()` → `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` + `Content-Security-Policy-Report-Only`.
- **P-1:** 11 bg-bilder konverterade JPG → WebP @ q=75, max 1600w. **25MB → 4.4MB (82% minskning).** Alla 8 refs uppdaterade.

### Upptäckt under fasen
- Audit:en specade 4 bilder, men 7 till var över 400KB → komprimerade alla för konsekvens.
- `riviera.webp` (854KB) + `eirik.webp` (565KB) något över 500KB-målet. Acceptabelt; bevakas via Speed Insights.

---

## Fas 2 — KLAR ✓

- **Commit:** `d55cca9`
- **Pushad till origin/main:** ja
- **Vercel deploy:** `moidello-ixxa5i42q...` Ready (56s build)
- **moidello.com:** HTTP 200

### Vad som ändrats
- **BUG-1:** `app/admin/inlagg/[id]/OutfitEditor.tsx` — `startDrag` ersatt med `startPointer` som har movement-threshold (5px). Klick < 5px rörelse → `focusTagCard(tagId)` som scrollar `#tag-card-<id>` till view och `:focus`:ar första input. Drag >= 5px = som tidigare. Tag-cards har nu `id`, `scroll-mt-24`, hover/focus-within border-styling. Pin-tooltip ändrad till "klick = redigera, drag = flytta".
- **BUG-2:** `components/outfit/OutfitOwnerActions.tsx` — Redigera-knappen renderas nu för alla (admin OCH ägare). `editHref`-prop styr destination (admin → `/admin/inlagg/[id]`, ägare → `/profil/inlagg/[id]`).
- **BUG-2:** Ny route `app/profil/inlagg/[id]/page.tsx` + `EditOwnOutfit.tsx`. Ägare kan redigera titel, beskrivning, kategori. SEO-meta + schemaläggning + gender är admin-only.
- **BUG-2:** Ny server action `updateOwnOutfit` i `app/actions/user-content.ts` skyddad av `gateOwnerOrAdmin`. Validation: title max 200, description max 2000, category trimmed.
- **BUG-2:** `app/profile/[username]/ProfileDetail.tsx` — när `isOwnProfile`, rendras `OutfitOwnerActions` under varje OutfitCard. Andra användare ser oförändrat grid.

### Upptäckt under fasen
- `Outfit`-typen har redan `isHidden?: boolean` (rad 92 i `lib/types.ts`).
- Inga audit-fil/rad-mismatchar.

---

