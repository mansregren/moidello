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

## Fas 3 — KLAR ✓

- **Commit:** `e993f88`
- **Pushad till origin/main:** ja
- **Vercel deploy:** `moidello-db1atlets...` Ready (1m build)
- **moidello.com:** HTTP 200

### Vad som ändrats
- **BUG-3a:** `app/admin/inlagg/[id]/OutfitEditor.tsx:411-446` — `refetchFromUrl` patchar nu också `retailer` + `retailer_locale` så geo-redirect faktiskt har data att jobba med.
- **BUG-3a:** `updateTaggedItem` i `app/actions/admin-content.ts` accepterar nu `retailer` + `retailer_locale` i patch-typen. `saveTag` skickar dem.
- **BUG-3b:** `supabase/migrations/0032_backfill_tagged_item_retailer.sql` — idempotent backfill av `retailer` + `retailer_locale` på existerande rader. Hjälpfunktioner i `private.` schema (`url_apex_host`, `url_first_path_segment`). Mappar 31 domain-host:s till retailer-id; locale-detection per retailer baserat på URL-pattern.
- **BUG-3+4c:** 6 nya retailer-moduler i `lib/retailers/`:
  - `hm.ts` — `/<lang>_<country>/` (sv_se, da_dk, en_us etc), 17 locales
  - `cos.ts` — `/en_<currency>/` (en_sek, en_eur etc), 15 locales
  - `arket.ts` — samma mönster som COS, 15 locales
  - `nakd.ts` — `/<lang>/` eller `/<lang>-<country>/`, 12 locales
  - `nelly.ts` — `/<country>/`, 4 nordiska locales
  - `filippak.ts` — `/<lang>-<country>/`, 15 locales
- `lib/retailers/stubs.ts` rensad: bara `acnestudios`, `toteme`, `ganni`, `sezane`, `mango` kvar som stubs. `lib/retailers/index.ts` uppdaterad med nya imports.
- **BUG-4:** `lib/retailers/openGraphFallback.ts` har nu `inferPriceFromHtml`-fallback med 3 regex-pattern: `data-price=`, `class="price"`, fri-text `1 295 kr` / `$199`. `parsePriceString` hanterar både europeiska (1.295,00) och amerikanska (1,295.00) decimaler.

### Upptäckt under fasen
- Migrationen ligger i `supabase/migrations/0032_...sql` men har **INTE** applicerats på prod. Måste pushas med `npx supabase db push` när du är tillbaka — Claude kan inte köra migrations enligt deployment-rutinerna i AGENTS.md.
- Inga audit-fil/rad-mismatchar.

---

## Fas 4 — KLAR ✓

- **Commit:** `9ca035b`
- **Pushad till origin/main:** ja
- **Vercel deploy:** Ready (verifierad manuellt i dashboard — poll-skriptet är fortfarande brokenrelaterat awk-format men deployen själv är grön)

### Vad som ändrats
- **BUG-5a:** Gender-filter applicerat där det saknades:
  - `/profile/[username]` (`ProfileDetail.tsx`) — klient-sidigt via `useGender`, ägare ser ALLT regardless av toggle.
  - `/sok` (`app/sok/page.tsx:94`) — server-sidigt via `getViewerGender()` + `.eq("gender", gender)` på outfits-query.
  - `/brand/[slug]` — `fetchBrandOutfits(name, gender)` filtrerar på outfits.gender.
  - `/brands` — `fetchBrandsAggregated(_, gender)` räknar bara outfits för viewer's gender.
- **BUG-5b+c:** `lib/gender-context.tsx` skriven om från `useSyncExternalStore` till plain Context + useState. Nytt: `moidello_gender_pref`-cookie skrivs av `GenderToggle` (path=/, max-age=1år, samesite=lax, secure). Ny server-helper `lib/gender-server.ts:getViewerGender()` läser cookien. `app/layout.tsx` skickar in `initial` till `<GenderProvider>` så SSR/första-paint matchar viewer's preferens — **hydration-flash eliminerad**.
- **UX-1:** `app/manifest.ts` fanns redan (audit-false-positive — auditen letade i `/public/manifest.json`). Lade till `scope: "/"` och `categories` för PWA-kvalitet.
- **UX-2:** 5 nya `loading.tsx` (profil, skapa, admin, brands, sok) + återanvändbar `components/shared/OutfitGridSkeleton.tsx`. Skeleton-kort med `animate-pulse`.
- **S-3:** `/go/[itemId]` `console.warn` loggar nu när ett buy_url passthrough:as utan känd retailer — phishing-monitoring utan att blockera ägare som vill länka till mindre retailers.

### Upptäckt under fasen
- `app/manifest.ts` fanns redan — det här är ett audit-misstag. UX-1 är delvis levererat sedan tidigare; mina ändringar är en upgradering (scope+categories).
- Admin-UI badge "Okänd retailer" finns redan i både `PasteTagForm` och `TagsEditor` (`TagStatusBadge`) — den var redan implementerad. Ingen ytterligare ändring krävdes för S-3:s UI-del.

---

