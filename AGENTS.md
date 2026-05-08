<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Aktuell status

Senast uppdaterad: 2026-05-09

### Senast deployat (commit-hashar på `main`)

- `45a90d2` — **OG-bild-fix.** Anton-fonten bytt från `github.com/google/fonts` (170 KB, ships en DSIG-tabell som kraschar Satori) till fontsource (25 KB, latin-subset, ingen DSIG). `Cannot read properties of undefined (reading '256')` är borta. Påverkar alla `/.../opengraph-image`-routes (outfit, produkt, profil) → social-media-delning visar nu rätt förhandsbild.
- `a319cbd` — **DM-fix.** `markConversationRead` flyttad från server-render i `app/meddelanden/[id]/page.tsx` till klient-mount-`useEffect` i `ConversationThread.tsx`. Next 16 förbjuder `revalidatePath` under render — det som gav digest `2591544316@E7` och vänner i Vercel runtime-logs. Funktionellt identiskt: inkorgens unread-count uppdateras fortfarande efter att en tråd öppnats.
- `9f3a13b` → `45a90d2` — **URL-refactor 3a–3d.** Outfit-URL flyttad från `/outfit/<uuid>` till `/<username>/<slug>`:
  - 3a (`d3..`-serien): `outfits.slug`-kolumn + unique-index `(user_id, slug)` + backfill av seed-outfits + `slugify`+retry-on-23505 i `/skapa`-action.
  - 3b: `app/[username]/[slug]/page.tsx` + layout + opengraph-image, `RESERVED_USERNAMES`-set blockerar systemnamn (`meddelanden`, `profil`, `om`, …) från att ta över route-trädet.
  - 3c: `permanentRedirect` (308) i `app/outfit/[id]/page.tsx` när slug+username finns på outfiten — ingen länk i det vilda går sönder.
  - 3d: alla interna länkar (`OutfitCard`, `OutfitDetail` ShareButton, `ShareCards`, `ProduktPage` × 3, sitemap.xml, sitemap-images.xml, JSON-LD-builders) använder `outfitPath()`/`outfitPathFromParts()`. Sitemap emitterar 19 outfits på den nya formen, 0 legacy-rader.
- **SEO-paketet (commits 1–7)** — komplett. Sitemap, image sitemap, JSON-LD (Organization + WebSite SearchAction + Person + Product + BreadcrumbList + ItemList), `noindex` på privata sidor, UGC-länkpolicy, Search Console-meta. Detaljer i git-loggen från sessionen 2026-05-08.

### Att verifiera när användaren är tillbaka

- **End-to-end DM-test A→B→A i prod** (Mans har inte testat ännu efter `a319cbd`):
  1. Logga in som A → `/profile/<B>` → "Skicka meddelande" → ska landa på `/meddelanden/<uuid>`, inte felkod.
  2. Skicka `test A→B 1`. Logga in som B i inkognito → `/meddelanden` ska visa A med unread-badge.
  3. B öppnar tråden → meddelandet syns, badge försvinner. Svara `test B→A 1`.
  4. Tillbaka som A → refresh `/meddelanden` → B har unread-badge → läs.
- **OG-bild-preview** efter `45a90d2`: klistra `https://moidello.com/<username>/<slug>` (t.ex. `/emmastyle/venice-cardigan`) och en `/profile/<username>` i iMessage + WhatsApp. Förhandsbilden ska visas som 1200×630 PNG, inte miss-fail'a till generisk Moidello-text-fallback eller saknas helt.

### Nästa stora bitar i kö (prioordning)

1. **Bulk-upload för märken.** Gratis funktion. Infrastruktur som förbereder för annonser/sponsring senare, men inga betal-flöden i denna iteration. Behöver datamodellsdiskussion innan kod (CSV vs admin-UI vs API, item-validation, brand-claim-flöde).
2. **Spara enskilda plagg + Följer/Följare-tabar + radera kommentarer + dela outfits/plagg via meddelande.** Sista bit:en (dela via meddelande) finns redan delvis — `OutfitShareCard`/`ItemShareCard` i `components/messaging/ShareCards.tsx` renderar redan share-payloads, behöver bara entry-points i UI.
3. **Eventuell "Om Moidello"-sida / kontaktsida-uppdatering.** `/om` och `/kontakt` finns men kan behöva editorial pass.

### Öppna frågor / beslut väntande från användaren

- Inga öppna i nuläget. Bulk-upload-bitens datamodell är nästa diskussionspunkt när Mans återupptar.

### Aktiva tasks

Inga öppna — allt avklarat per 2026-05-09 00:30.



## Deployment-rutiner

**Innan varje commit som rör build (komponenter, routes, metadata, sitemap, OG-images):**

1. Kör `npm run build` lokalt
2. Verifiera grön build innan commit
3. Vid TypeScript- eller Next.js-fel — fixa innan push

**Efter push till `main`:**

1. Påminn användaren att kolla Vercel-deploy
2. Om build failar — STOPPA allt nytt arbete tills deployen är grön igen
3. Användaren ser GAMMAL kod tills build passerar. "Det verkar inte funka" = ofta en failad deploy, inte en bugg i koden.

**Vanliga build-fel att undvika i Next.js App Router:**

- `cookies()`, `headers()` eller `@/lib/supabase/server` (som internt använder cookies) i `generateStaticParams`, `generateMetadata`, `generateImageMetadata` eller `opengraph-image.tsx` → använd `createPublicClient()` från `@/lib/supabase/public` istället. Alla `lib/queries.ts`-fetchers tar en valfri `client?: QueryClient` — skicka in den publika clienten där.
- `cookies()` i `app/sitemap.ts`, `app/robots.ts` eller andra route-filer som körs vid build → samma fix.
- Server actions importerade i client components utan `"use server"`-direktiv i action-filen.
- Imports från `@/server/...` i client components.

**Om flera deploys i rad failar:**

- Hitta senaste lyckade deploy
- All kod efter den är inte i prod — användaren testar gammal kod
- Fixa builden innan något annat arbete

## Miljövariabler

| Variabel | Användning | Krav |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase-projekt URL | Krävs i alla miljöer |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key för RLS-skyddad publik åtkomst | Krävs i alla miljöer |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Token från Google Search Console — renderas som `<meta name="google-site-verification">` via `metadata.verification.google` i `app/layout.tsx` | Valfri. Frånvaro = ingen meta-tag, ingen krasch. Sätts när Moidello verifieras i Search Console. |

Sätt via Vercel → Project → Settings → Environment Variables för alla tre miljöer (Production, Preview, Development) + lokal `.env.local` för dev.

## UGC-länksäkerhet

Alla utgående länkar som innehåller eller pekar mot användar-genererat innehåll (köp-länkar i taggade plagg, sociala media-länkar i bios, kommentarer som länkar) ska wrappas i `<UserLink>` (`components/shared/UserLink.tsx`). Komponenten sätter automatiskt `rel="ugc nofollow noopener noreferrer"` + `target="_blank"`. Använd inte rå `<a target="_blank" href="...">` för UGC-länkar.
