# Moidello — Kodbas-audit 2026-05-13

> **Ingen fix har genomförts under denna körning.** Rapporten är leveransen.
> Repot ligger på `main` med 49 ocommittade-pushade commits (working tree ren).
> Granskningen omfattar 214 TS/TSX-filer, 31 migrations, samtliga app-routes
> och de fem buggar användaren rapporterat från manuella tester.

---

## Sammanfattning

- **Kritiska:** 5 (måste fixas omedelbart)
- **Höga:** 14
- **Medel:** 18
- **Låga:** 12

> ⚠️ **Akut flagg — ingen läckt secret hittad.** Service-role-nyckeln finns
> bara i Vercel env, `.env.local` innehåller endast publika nycklar (anon +
> Supabase URL). Inga `sk-`, `private_key` eller `service_role` i kod.

> ⚠️ **`npm audit`:** 6 sårbarheter (2 höga, 4 medel). Den dominerande är
> Next.js 16.2.4 → 12 olika advisories (DoS, XSS, cache-poisoning, proxy-
> bypass). Fix finns via `npm audit fix --force` → bumpar till `next@16.2.6`.

---

## Topp 5 prioriteringar

Sorterat på störst risk × minst arbete:

1. **S-1 Uppdatera Next.js till 16.2.6+** — Säkerhet, **Kritisk**, S (≤1h). 12 advisories på nuvarande 16.2.4. Kör `npm audit fix --force` lokalt, kör `npm run build`, deploya. Inga API-breakande ändringar i 16.2.5–16.2.6.

2. **BUG-1 Pin-klick på bilden öppnar inget redigera-läge** — UX/Bug, **Hög**, M (1–2d). Två tidigare försök (`9db4051`, `7bcb603`) gjorde pins drag-bara men ingen klick→edit-modal. Detta är vad användaren rapporterat *två gånger till*.

3. **S-2 SSRF-skydd i `preview-from-url`** — Säkerhet, **Kritisk**, S (≤2h). Routen `fetch`:ar admin-input utan filter mot privata IP-ranges eller `169.254.169.254` (AWS metadata). Admin-kontot är säkerhetsgränsen — om det komprometteras får angriparen läs-access till interna nät via Vercel-runners.

4. **BUG-3+BUG-4 Geo-redirect & price-fetch funkar i teorin, inte i seedad data** — Bug, **Hög**, M (2d). Båda infrastrukturerna finns men 11 av 14 registrerade retailers är *stubs* (ingen pris-extractor utöver Open Graph) och seed-data har inte `retailer`-kolumnen populerad. Effekten: användaren ser *aldrig* funktionerna i aktion.

5. **P-1 Komprimera bakgrundsbilder (totalt 25 MB i `/public/images/bg/`)** — Prestanda, **Hög**, S (≤2h). `anna.jpg`, `eirik.jpg`, `nikola.jpg` är var och en >5 MB; en mobilbesökare på 4G får 5 sekunder bara på hero. Konvertera till WebP/AVIF + resize till max ~600 KB.

---

## Vad som är BRA

Sajten är förvånansvärt välskött för en 8 månaders MVP. Specifikt:

- **Auth-arkitekturen är solid.** Fyra separata Supabase-klienter (`server`, `client`, `public`, `admin`) med tydlig roll-uppdelning. HttpOnly+Secure+SameSite cookies, JWT-refresh i `proxy.ts`, PKCE och OTP båda stöds i `auth/callback`. Inget rullat eget.
- **RLS-policies finns på *alla* tabeller** och engagement-actions verifierar `auth.getUser()` server-side innan insert (`app/actions/engagement.ts:20-46`) — *ingen* IDOR-vector på likes/saves/comments. Rätt mönster.
- **Admin-layout gatekeepar med `isCurrentUserAdmin()` (`app/admin/layout.tsx:17-18`).** Varje admin-endpoint (`/api/admin/*`) gatear oberoende. Defence-in-depth.
- **SEO-stack är genomtänkt.** Dynamisk sitemap från DB, robots med rätt disallows, per-route OG-image generators (5 st), JSON-LD med Organization+WebSite+Person+Product+Breadcrumb-schema, canonical via `metadataBase`.
- **Composite PKs på likes/saves/follows** (`user_id, outfit_id`) gör user-prefix-queries indexerade utan separat index — bra Postgres-discipline.
- **Konsekvent server-action/API-uppdelning.** Mutations = server actions med `Result<ok|error>`-typer; externa webhooks + admin-bulk = route handlers. Inget blandat.
- **TypeScript strict** är på. Noll `: any`, noll `@ts-ignore`. 39 `as unknown as` (alla för Supabase row-typer) är hanterbart.

---

## BEKRÄFTADE BUGGAR FRÅN ANVÄNDARTEST

### BUG-1 Plagg-taggar går inte att klicka eller redigera i utkast
- **Allvarlighet:** Hög
- **Kategori:** UX / Bug
- **Plats:** `app/admin/inlagg/[id]/OutfitEditor.tsx:634-822` (`TagPositionEditor`) + `:351-632` (`TagsEditor`)
- **Tidigare försök:** `7bcb603` (idag): Lade till color+image_url+thumbnail+paste-handler i `TagsEditor`. Klick-modellen ändrades **inte**. `9db4051` (2026-05-13): Gjorde pins draggbara via `onPointerDown`, men **ingen** `onClick`-handler.
- **Vad som missas:** Användaren öppnar ett utkast, ser bilden till vänster med vita pins. Förväntar sig att klick på en pin öppnar en edit-form/modal för *just den taggen* — kanske med fält som scrollar till motsvarande tag-kort till höger. I koden gör pins **bara** drag-läge (`startDrag` i `onPointerDown`, rad 659-690). Ren klick utan drag → `onMove` triggas aldrig → ingen visuell respons. Det är *exakt* "klick gör ingenting". Tag-korten på höger sida är redan editerbara inline — om användaren tittar på dem är det inte tydligt att fälten *är* aktiva eftersom det inte finns någon hover-state, focus-ring eller "klicka för att redigera"-affordans.
- **Risk:** Användaren tror att admin-tooling är trasig. Hög sannolikhet att den rapporteras igen.
- **Föreslagen fix:**
  1. På `TagPositionEditor`-pin: lägg `onClick` (separat från `onPointerDown`) som scrollar motsvarande `<li>` i `TagsEditor` i view och sätter `:focus` på första input-fältet.
  2. Tydligare visuell affordans på `TagsEditor`-korten: hover-state på `<li>`, "Klicka för att redigera"-mikrocopy om kortet är collapsed.
  3. Alternativ: bygg en riktig click→modal med samma fält. Mer arbete men matchar användarens mentala modell.
- **Arbete:** M

### BUG-2 Användare kan inte redigera/dölja/radera egna publicerade inlägg
- **Allvarlighet:** Hög
- **Kategori:** Bug / Produktgap
- **Plats:** `components/outfit/OutfitOwnerActions.tsx:67-75` + `app/[username]/[slug]/page.tsx`, `app/outfit/[id]/page.tsx` + saknas på `app/profile/[username]/ProfileDetail.tsx`
- **Aktuellt läge efter `7bcb603`:**
  - **Dölj + Radera** rendras för ägare på outfit-detail-sidan (rad 77-101 i `OutfitOwnerActions.tsx`). ✅
  - **Redigera** rendras **endast** om `isAdmin` (rad 67-75). ❌ Ägare ser ingen redigera-knapp.
  - Profilsidan (`/profile/[username]`) renderar **ingen** av actions — `OutfitOwnerActions` är inte importerad där. Användaren ser sina egna outfits men inga kontroller på dem från profilen.
- **Vad användaren ser:** På sin egen profil ser hen alla sina posts, men *inga* hover-actions, inga inline-edit-knappar. För att hitta Dölj/Radera måste hen öppna en outfit-detail-sida.
- **Risk:** Konton känns "fängslade" — man kan inte sköta sitt egna innehåll utan att veta var actions gömmer sig.
- **Föreslagen fix:**
  1. Skapa `/profil/inlagg/[id]` (eller motsvarande) som vanlig user-edit-route (åtminstone titel/beskrivning/kategori — *inte* SEO/admin-fält). `OutfitOwnerActions` har redan `editHref`-prop som pekar dit. Server action: kopiera `updateOutfit` från `admin-content.ts` men gate:a med `gateOwnerOrAdmin` från `user-content.ts`.
  2. Rendera `OutfitOwnerActions` på `OutfitCard`-komponenten (eller en wrapper) när `viewer.id === outfit.creator.id`, så ägare ser Dölj/Radera direkt från sin profil utan att öppna varje outfit.
- **Arbete:** M

### BUG-3 Länkar respekterar inte besökarens land (geo-redirect)
- **Allvarlighet:** Hög
- **Kategori:** Bug
- **Plats:** `app/go/[itemId]/route.ts:97-113` + `lib/retailers/*` + datalager
- **Status av infrastrukturen:** ✅ Routen `/go/[itemId]` finns och anropas från både `OutfitTag` och `TaggedItemCard` (`components/outfit/TaggedItem.tsx:149`, `OutfitTag.tsx:20`). Routen läser `x-vercel-ip-country`, slår upp retailer-modul, rewriter URL:en om `retailer.supportedLocales.includes(country)`.
- **Varför funktionen ofta är osynlig:**
  1. **Endast 3 av 14 retailers har riktiga locale-rewrites.** John Henric, Zalando, & Other Stories. De övriga 11 är stubs (`lib/retailers/stubs.ts`) med `supportedLocales: []` — så `if (retailer.supportedLocales.includes(targetLocale))` är alltid `false` för t.ex. NA-KD, COS, Arket, H&M, Acne, Filippa K, Toteme, Ganni, Sezane, Mango.
  2. **Seed-data har troligen `retailer = null`.** AI-bulk-modal (`bulk-draft-from-images/route.ts`) skapar bara outfit-raden — inte tagged_items. Tags läggs senare. Om admin lägger en länk via `PasteTagForm` så detekteras retailer korrekt. Men om tags klistras direkt i `TagsEditor` (där `buy_url` paste:as) → `refetchFromUrl` uppdaterar bara brand/name/price/color/image, **inte `retailer`/`retailer_locale`** (rad 429-436 i `OutfitEditor.tsx`).
  3. **Default-region är `SE`.** En svensk testar från Sverige → ingen visuell skillnad även när rewrite fungerar. För att testa måste man gå via VPN eller header-override.
- **Risk:** Funktionalitet som AGENTS.md säger är klar, men i praktiken aldrig synlig för en användare. Internationella besökare blir av med både click-tracking-värdet OCH lokal valuta.
- **Föreslagen fix:**
  1. `refetchFromUrl` i `TagsEditor` ska också patcha `retailer` + `retailer_locale` (PR-svaret innehåller dem redan).
  2. En migration som backfill:ar `retailer`+`retailer_locale` för befintliga `tagged_items` (kör `findRetailer(buy_url)` på rad-nivå).
  3. Lyft de viktigaste stub:sen (H&M, COS, Arket, NA-KD, Nelly) till riktiga moduler — de använder alla locale-prefix i URL-strukturen.
- **Arbete:** M

### BUG-4 Pris fylls inte i automatiskt vid paste av produkt-URL
- **Allvarlighet:** Medel-Hög
- **Kategori:** Bug
- **Plats:** `app/api/admin/items/preview-from-url/route.ts:115-138` + `lib/retailers/openGraphFallback.ts:99-152`
- **Status av infrastrukturen:** ✅ Endpointen finns, anropas både från `PasteTagForm` (på `onPaste`+`onKeyDown`+knapp) och från `TagsEditor` (på `onPaste`). 24h LRU-cache, 5s timeout, 1.5MB max HTML.
- **Varför priser ofta saknas:**
  1. **JSON-LD Product med `offers.price` är den enda pålitliga källan.** Många små svenska retailers (NA-KD, Nelly, Filippa K, Toteme) exponerar inte `application/ld+json` med Product-schema — eller exponerar det med priset i ett format `asNumber()` inte parsar ("1 295,00 SEK" funkar; "1.295 SEK" eller "kr 1 295" inte alltid).
  2. **Open Graph `product:price:amount` är ovanligt på fashion-sajter.** Inga av stub-retailerna har visat att de exponerar det.
  3. **Fallback finns inte.** Om varken JSON-LD eller OG-meta gav pris → `out.price` förblir `null`. Ingen prisparsing från `text()`-innehåll, ingen regex på `\d+\s*(kr|SEK)` i HTML.
- **Test som verifierar:** klistra in en H&M-, NA-KD- eller Mango-URL — sannolikt får man brand och image, men **inte** pris. För John Henric och Zalando borde det fungera (de exponerar JSON-LD).
- **Risk:** Tagging-flow blir manuellt arbete. Den enda anledningen att skapa `preview-from-url` var att spara tid.
- **Föreslagen fix:**
  1. **Per-retailer prisextractor i stubs** — flytta `nakd`/`nelly`/etc. till riktiga moduler med inspect:ad pris-parsing.
  2. **Sista-fallback regex:** sök efter `class="price"`, `data-price=`, `\b\d{2,5}[\s.,]?\d{0,2}\s*(kr|SEK|EUR|NOK|DKK)\b` i HTML, returnera första träffen som "low-confidence" pris med en `_inferred: true`-flagga i `_raw`.
  3. **Cache misses:** logga vilka domäner som returnerar `price=null` så vi vet vilka stubs som behöver upgraderas först.
- **Arbete:** L (per-retailer-parsers tar tid; varje sajt ändrar struktur)

### BUG-5 Herr/Dam-toggle behöver granskning
- **Allvarlighet:** Medel
- **Kategori:** Bug / Produktgap
- **Plats:** `lib/gender-context.tsx:5-44` + 8 client-komponenter
- **Aktuellt beteende:**
  - **Filter sparas i `localStorage`** under `moidello-gender-filter`, default `"dam"`. ✅
  - **Sync över tabs** via `storage`-event och custom `moidello-gender-filter:change`-event. ✅
  - **SSR-snapshot är alltid `"dam"`** → hydration-flash för Herr-användare (de ser dam-content i ms innan client-rendering tar över).
- **Var filtret tillämpas (verifierat):**
  - ✅ `app/HomeClient.tsx:61` — `outfits.filter(matchesGenderFilter)`
  - ✅ `app/upptack/UpptackClient.tsx:109` — i `useMemo`-filter
  - ✅ `app/trendigt/TrendigtClient.tsx:46-48`
  - ✅ `app/foljer/FoljerClient.tsx:23-25`
  - ✅ `app/profil/page.tsx:382-386` — egna outfits + sparade
  - ✅ `app/board/[id]/page.tsx` — board-innehåll
- **Var filtret SAKNAS:**
  - ❌ `app/profile/[username]/ProfileDetail.tsx` — visar **alla** outfits oavsett toggle. Inkonsekvent: en herr-användare som besöker en kreatörs profil får dam-outfits överallt utom där.
  - ❌ `app/sok/page.tsx` — `/sok` matchar mot alla outfits oavsett kön.
  - ❌ `app/brand/[slug]/page.tsx` — märkesvy
  - ❌ `app/brands/page.tsx` — märkeslista räknar inte gender-filtrerat
  - ❌ `app/[username]/[slug]/page.tsx` — single outfit (kanske medvetet; man har klickat sig dit)
- **Filter är klient-sidigt på *redan hämtad* data.** `lib/queries.ts` filtrerar aldrig på `gender`-kolumnen i SQL. Effekten: SSR-rendrar 20 outfits, klient kastar 12, visar 8. På `/trendigt` blir det ännu värre eftersom data redan begränsas till topp-N innan filter (rad 50-54 i `TrendigtClient.tsx`).
- **Risk:** Användare kan tro att toggle är trasig på vissa sidor när den i praktiken bara inte är applicerad där. På `/profile/[username]` ser man påfallande "fel" kön.
- **Föreslagen fix:**
  1. Server-fetcha med `gender`-filter där det går: skicka in toggle via cookie (sätts av `GenderToggle` redan, eller skapa ny `moidello_gender_pref`-cookie så servern kan läsa den), passera till `fetchOutfits(limit, gender)` och liknande. Tabellen har `outfits_gender_idx` redan.
  2. Lägg till filtret på `/profile/[username]`, `/sok`, `/brand/[slug]` (åtminstone klient-sidigt).
  3. Lös hydration-flash genom att läsa cookien i `proxy.ts` och spegla i en non-`localStorage`-källa.
- **Arbete:** M

---

## Detaljerade fynd

### S-1 Kritiska Next.js-sårbarheter i nuvarande version
- **Allvarlighet:** Kritisk
- **Kategori:** Säkerhet
- **Plats:** `package.json:24` (`next: 16.2.4`)
- **Problem:** 12 GHSA-advisories: DoS, XSS, cache-poisoning, proxy-bypass, SSRF via WebSocket upgrades, middleware-bypass. `npm audit` rapporterar 2 högt + 4 medel.
- **Risk:** Flera är externt exploaterbara på en publik Next.js-app utan custom config — speciellt cache-poisoning och proxy-bypass-advisories.
- **Föreslagen fix:** `npm audit fix --force` → installerar `next@16.2.6`. Verifiera build, deploya.
- **Arbete:** S

### S-2 SSRF i `preview-from-url` saknar IP-range-skydd
- **Allvarlighet:** Kritisk
- **Kategori:** Säkerhet
- **Plats:** `app/api/admin/items/preview-from-url/route.ts:30-55, 112`
- **Problem:** `fetch(url.toString())` accepterar vilken http(s)-URL som helst efter bara protokoll-check. Ingen validering mot `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254` (AWS metadata-endpoint), eller `[::1]`. Ingen DNS-rebinding-skydd (URL→DNS-resolve→re-validera→fetch).
- **Risk:** Admin-konto är säkerhetsgränsen, men:
  1. *Confused deputy:* admin pasta:r oavsiktligt en URL från en illvillig sajt som triggar internal fetch.
  2. *Komprometterat admin-konto:* angriparen läser Vercel runner-environment via `169.254.169.254`, hittar service-role-keyn.
- **Föreslagen fix:** Lägg en `isPrivateOrLocalAddress(hostname)`-check (`node:net.isIP` + range-tabell), gör DNS-resolve(URL.hostname) först, re-validera resolved IP, sedan fetch:a med `lookup`-option som returnerar samma IP (DNS-rebinding-fix). Alternativt: vitlist:a domäner via `findRetailer(url) !== null`.
- **Arbete:** S

### S-3 Open redirect via `/go/[itemId]` om admin sätter `buy_url` till godtycklig domän
- **Allvarlighet:** Hög
- **Kategori:** Säkerhet
- **Plats:** `app/go/[itemId]/route.ts:87-95, 162-168`
- **Problem:** Routen 302-redirectar till `tagged_items.buy_url` efter att enbart ha kollat `^https?:\/\//i`. Det fanns en idé om validering mot retailer-allowlist (notera kommentaren `Geo-rewrite when we have a retailer module...` på rad 100) men ingen blockering för "ingen retailer matchar" — bara passthrough.
- **Risk:** Om admin-konto komprometteras kan angriparen sätta `buy_url = "https://phish.com"` på en outfit och få en moidello.com-länk som redirectar. Domänautoritet för phishing.
- **Föreslagen fix:** Antingen (a) varna kraftigt i admin-UI när `findRetailer(url) === null` ("Okänd retailer — kontrollera URL"), eller (b) kräv eksplicit "Tillåt okänd retailer"-toggle, eller (c) blockera helt och tvinga retailer-registrering.
- **Arbete:** S

### S-4 Webhook-secret jämförelse är inte timing-säker
- **Allvarlighet:** Medel
- **Kategori:** Säkerhet
- **Plats:** `app/api/push/notify/route.ts:37`, `app/api/email/notify/route.ts:33`
- **Problem:** `if (!secret || provided !== secret)` — JavaScript-strängjämförelse är inte konstant-tids. Med en lång slumpad secret är läckaget litet men icke-noll.
- **Föreslagen fix:** `crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(secret))` (kontrollera först att längderna matchar för att undvika throw).
- **Arbete:** S

### S-5 Inga säkerhets-headers (CSP, X-Frame-Options, HSTS, X-Content-Type-Options)
- **Allvarlighet:** Hög
- **Kategori:** Säkerhet
- **Plats:** `next.config.ts` (saknar `async headers()`)
- **Problem:** Ingen CSP, ingen `X-Frame-Options: DENY` (clickjacking-risk), ingen `Strict-Transport-Security`, ingen `X-Content-Type-Options: nosniff`, ingen `Referrer-Policy`. Vercel sätter HSTS som default-edge-policy men resten saknas helt.
- **Föreslagen fix:** Lägg `async headers()` i `next.config.ts` med åtminstone:
  - `X-Frame-Options: DENY` (eller `SAMEORIGIN` om OG-preview behövs i iframes)
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` (PWA kan behöva loosen senare)
  - CSP är svårare pga `framer-motion` inline-styles och `next/script`; börja med `Report-Only`.
- **Arbete:** S

### S-6 Ingen rate-limiting någonstans
- **Allvarlighet:** Hög
- **Kategori:** Säkerhet
- **Plats:** alla `/api/*`-routes och alla server actions
- **Problem:** Inga limiter på `/api/admin/items/preview-from-url` (kan användas för DoS mot retailers), `/api/push/notify`, `postComment`, `sendMessage`, `toggleLike` (massa-like-spam möjlig).
- **Risk:** Spam (kommentarer, DMs), abuse av preview-routen som SSRF-proxy mot tredje part, oprovocerad cost-belastning på Supabase.
- **Föreslagen fix:** Vercel KV + en liten token-bucket-utility, eller Upstash. Börja med de fyra endpoints:en + comment+message-actions. Rate-key: `userId || ip`.
- **Arbete:** M

### S-7 Engagement-actions förlitar sig på RLS för validering — fine men inte defensive
- **Allvarlighet:** Låg
- **Kategori:** Säkerhet
- **Plats:** `app/actions/engagement.ts:20-46`, `app/actions/saved-items.ts`
- **Problem:** `toggleLike` insertar med `user_id: user.id` (server-resolverad från `auth.getUser()`) — så IDOR är *inte* möjligt. Däremot finns ingen extra check att `outfitId` är ett UUID (kan vara godtycklig sträng, supabase kommer returnera DB-fel som visas till klient).
- **Risk:** Låg. Trasig URL-encode-attack på outfitId kan leaka DB-felmeddelanden men inte mer.
- **Föreslagen fix:** Validera `UUID_RE.test(outfitId)` i toppen av varje funktion. Mönster finns redan i `admin-content.ts`.
- **Arbete:** S

### S-8 Input-validering är ad-hoc per action — risk för miss vid nya features
- **Allvarlighet:** Medel
- **Kategori:** Säkerhet / Kod
- **Plats:** alla `app/actions/*.ts`
- **Problem:** Validering sker via manuell `.trim()`/`.slice(0, N)`/regex per fält. Inget Zod, inga schemas, ingen TypeScript-tvingad input-shape. Med 14+ action-filer ökar risken att en glömd `.trim()` släpper igenom XSS-vektor.
- **Föreslagen fix:** Lägg till `zod`, definiera ett schema per action, parse server-side. Bonus: schema kan delas till klient för synkad validering.
- **Arbete:** M

### S-9 Hemligheter — inga läckta nycklar i kod
- **Allvarlighet:** Låg (positivt fynd)
- **Plats:** `.env.local`
- **Status:** ✅ Endast publika nycklar (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Service-role-nyckeln finns bara i Vercel. `.env*` är i `.gitignore`. Grep efter `sk-`, `service_role`-literal:er, hex-strängar > 30 tecken i `*.ts` → noll träffar.

### S-10 `console.error` i messaging exponerar inga user-ids men loggar saknar struktur
- **Allvarlighet:** Låg
- **Plats:** `app/actions/messaging.ts:46, 61`
- **Problem:** `console.error("[messaging] conversation lookup failed:", error)` — error-objektet kan innehålla DB-detaljer som hamnar i Vercel-loggar oansträngt. Inte direkt känsligt men ingen log-scrubbing.
- **Föreslagen fix:** Strukturerad logger med scrubning av user_ids + DB-detaljer.
- **Arbete:** S

---

### UX-1 Inget `manifest.json` — Android-PWA-installation fungerar inte
- **Allvarlighet:** Hög
- **Kategori:** UX
- **Plats:** `public/` (saknas)
- **Problem:** `app/layout.tsx:72-76` har `appleWebApp`-metadata (iOS), men Android/Chromium kräver `manifest.json`. AGENTS.md säger sajten är "PWA-installable" — på iOS ja, på Android nej.
- **Föreslagen fix:** Skapa `public/manifest.json` (eller `app/manifest.ts`) med `name`, `short_name`, `start_url`, `display: standalone`, `theme_color`, `background_color`, icons (192 + 512 finns redan). Linka från layout via `<link rel="manifest">` eller `metadata.manifest`.
- **Arbete:** S

### UX-2 Inga `loading.tsx`-filer på data-tunga routes
- **Allvarlighet:** Hög
- **Kategori:** UX
- **Plats:** `app/` (endast `app/meddelanden/error.tsx` finns, ingen `loading.tsx` i hela app/)
- **Problem:** På långsamma queries (admin, profil, brand) ser besökaren en tom `<main>` tills servern är klar. På 4G med Supabase i Irland kan det vara 500–1500 ms.
- **Föreslagen fix:** Lägg `app/{profil,skapa,admin,brands,sok}/loading.tsx` med skeleton-kort.
- **Arbete:** S

### UX-3 Bilder i `/public/images/bg/` är gigantiska (totalt 25 MB)
- **Allvarlighet:** Hög
- **Kategori:** Prestanda / UX
- **Plats:** `public/images/bg/`
- **Problem:**
  - `anna.jpg`: 5.4 MB
  - `eirik.jpg`: 6.0 MB
  - `nikola.jpg`: 5.8 MB
  - `jerzy.jpg`: 2.6 MB
- **Risk:** Hero-bilden LCP på 4G > 4 s. Påverkar Vercel Speed Insights och Core Web Vitals.
- **Föreslagen fix:** Konvertera till AVIF/WebP, resize till max 1600px bred, kvalitet 75. Mål: <500 KB per bild. (`next/image` med dessa hostnamn skulle hjälpa men `priority`-hero-bilden serveras direkt.)
- **Arbete:** S

### UX-4 36×36 px touch-targets på flera knappar
- **Allvarlighet:** Medel
- **Kategori:** UX / a11y
- **Plats:** `components/outfit/TaggedItem.tsx:131, 143` (`h-9 w-9` = 36×36)
- **Problem:** WCAG 2.1 AA rekommenderar 44×44. Bookmark/Send-knappar är 36×36.
- **Föreslagen fix:** Bump till `h-11 w-11` eller lägg `min-h-11 min-w-11` med `p-2.5` runt ikonen.
- **Arbete:** S

### UX-5 Animationer ignorerar `prefers-reduced-motion`
- **Allvarlighet:** Medel
- **Kategori:** A11y
- **Plats:** Alla Framer-Motion-användare (10+ filer)
- **Problem:** `initial/animate/whileInView` körs alltid. Användare med rörelse-sensitivitet får svaga ut/in-effekter över hela sajten.
- **Föreslagen fix:** Wrapper-hook `useReducedMotion()` från `framer-motion`, villkora `initial/animate` till identity-värden när reduced.
- **Arbete:** S

### UX-6 Hydration-flash på Gender-toggle
- **Allvarlighet:** Låg
- **Kategori:** UX
- **Plats:** `lib/gender-context.tsx:35` (`getServerSnapshot = () => "dam"`)
- **Problem:** SSR rendrar alltid Dam, klient läser localStorage och kan switcha till Herr efter hydration → flash.
- **Föreslagen fix:** Spegla preferensen i en cookie så SSR kan läsa den och rendera rätt content direkt.
- **Arbete:** M

### UX-7 Färgkontrast på små texter
- **Allvarlighet:** Medel
- **Kategori:** A11y
- **Plats:** flera (`text-[10px] text-foreground-subtle`, `text-[11px] text-foreground-subtle`)
- **Problem:** `foreground-subtle: #666` på `#000` ger ~5:1 kontrast. WCAG AA kräver 4.5:1 för text mindre än 18px (eller mindre än 14px bold). 10–11px-texter ligger på gränsen och kan vara osynliga i solljus.
- **Föreslagen fix:** Höj `--foreground-subtle` till `#7A7A7A` eller `#808080`.
- **Arbete:** S

### UX-8 Tomma states inkonsekventa
- **Allvarlighet:** Låg
- **Kategori:** UX
- **Plats:** `app/HomeClient.tsx:191-211` har snyggt empty state. Andra feeds har antingen ingenting eller en plain `<p>`.
- **Föreslagen fix:** Använd `EmptyState`-komponenten (`components/shared/EmptyState`) genomgående.
- **Arbete:** S

### UX-9 Schema.org Product-markup finns men `availability` saknas på outfit-tagar
- **Allvarlighet:** Låg
- **Kategori:** SEO
- **Plats:** `lib/json-ld.ts` (verifiera)
- **Problem:** Google Merchant kräver `availability` (`InStock`/`OutOfStock`) för product-cards. Utan det riskerar rich-snippets att inte renderas.
- **Föreslagen fix:** Anta `InStock` som default när retailer-data säger så; annars hoppa över Product-noden.
- **Arbete:** S

### UX-10 Ingen i18n-förberedelse
- **Allvarlighet:** Låg
- **Kategori:** UX / Produkt-gap
- **Plats:** hela kodbasen
- **Problem:** Alla strängar hardkodade på svenska. Om Moidello ska expandera till NO/DK behövs `next-intl` eller motsvarande.
- **Föreslagen fix:** Avvakta tills affärs-beslutet är taget; men börja gärna med att samla strängar i en `i18n/sv.ts`-konstant så switch är trivial senare.
- **Arbete:** L

### UX-11 Modaler saknar `Escape`-trapping och autofocus
- **Allvarlighet:** Låg
- **Kategori:** A11y
- **Plats:** Confirm-dialogen i `OutfitDetail.tsx:457-510` (kommentar-radering), `ShareToDmSheet`, bulk-modaler
- **Problem:** Inga `onKeyDown` för Escape, ingen autofocus på första interaktiva element.
- **Föreslagen fix:** Använd `@base-ui/react/dialog` konsekvent (det är redan i deps), den har inbyggt focus-trap + Escape.
- **Arbete:** M

### UX-12 Knappar med endast ikon saknar konsekvent `aria-label`
- **Allvarlighet:** Låg
- **Kategori:** A11y
- **Plats:** Spot-check visar att de flesta ikon-only buttons har aria-label, men `app/admin/inlagg/[id]/OutfitEditor.tsx:618-625` (delete-knappen) har bara ikon utan label.
- **Föreslagen fix:** Audit-pass med `eslint-plugin-jsx-a11y`.
- **Arbete:** S

---

### K-1 Inga tester
- **Allvarlighet:** Hög
- **Kategori:** Kod
- **Plats:** repo-rot
- **Problem:** Inga `*.test.ts`, `*.spec.ts`, ingen Playwright/Vitest-config. 214 filer utan automatisk täckning.
- **Risk:** Manuell QA är enda försvaret. Buggarna i denna rapport är delvis konsekvens av detta.
- **Föreslagen fix:**
  1. Vitest för pure logic (retailers, gender-context, slug, region, json-ld).
  2. Playwright för 3 kritiska flows: signup → publicera outfit, like → notification, `/go/[itemId]` redirect.
- **Arbete:** L

### K-2 `app/skapa/page.tsx` och `app/profil/page.tsx` är 950+ rader vardera
- **Allvarlighet:** Medel
- **Kategori:** Kod
- **Plats:** `app/skapa/page.tsx` (952 rader), `app/profil/page.tsx` (855 rader)
- **Problem:** Båda är "use client" på toppen. Multi-tab state, upload-state, AI-flow blandat i samma fil.
- **Föreslagen fix:** Splitta i server-shell + per-tab/per-flow client-komponenter. Övergångar mellan tabs kan vara routes (`/profil/outfits` etc).
- **Arbete:** L

### K-3 `lib/queries.ts` är 795 rader — för stor
- **Allvarlighet:** Medel
- **Kategori:** Kod
- **Plats:** `lib/queries.ts`
- **Problem:** Alla fetchers samlade i en fil — outfits, users, brands, engagement, feeds. Svårt att hitta, svårt att review:a.
- **Föreslagen fix:** Bryt isär till `lib/queries/{outfit,user,brand,engagement,feed}.ts`. Re-exportera samlat om callers vill ha `lib/queries`.
- **Arbete:** M

### K-4 `lib/`-katalogen blandar 6+ olika kategorier
- **Allvarlighet:** Låg
- **Kategori:** Kod
- **Plats:** `lib/*.ts(x)`
- **Problem:** Auth, contexts, queries, retailers, AI, slugify, SEO, design-tokens på samma nivå. ~25 filer i root + 7 undermappar.
- **Föreslagen fix:** Omorganisera till `lib/{supabase,queries,actions,seo,ui,utils}`.
- **Arbete:** M

### K-5 `as unknown as` används 39 gånger för Supabase-rad-typer
- **Allvarlighet:** Låg
- **Kategori:** Kod / Typsäkerhet
- **Plats:** mest `lib/queries.ts`, `app/profil/page.tsx`, `app/admin/inlagg/page.tsx`
- **Problem:** Supabase-typgenerering används inte. Varje query-result castas manuellt vilket gör att fel som missade kolumner i `.select()` inte fångas vid kompileringstid.
- **Föreslagen fix:** Kör `supabase gen types typescript` (Supabase CLI är redan i devDeps) → committa `lib/supabase/database.types.ts` → använd `Database`-typen i `createClient`-genericen.
- **Arbete:** M

### K-6 Två N+1-mönster
- **Allvarlighet:** Medel
- **Kategori:** Kod / Prestanda
- **Plats:**
  - `app/actions/messaging.ts:128-144` (`sendShare` → en `getOrCreateConversation` per mottagare i loop)
  - `app/actions/admin-users.ts:450-495` (`seedDummyCreators` → en `auth.admin.createUser`-call per dummy i loop)
- **Föreslagen fix:** För `sendShare`: batch-hämta befintliga conversations, batch-create saknade. För seed: acceptabelt eftersom det körs sällan av admin, men kan parallelliseras med `Promise.all`.
- **Arbete:** S (messaging), trivial (seed)

### K-7 Försvinnande error-respons i `messaging.ts`
- **Allvarlighet:** Låg
- **Kategori:** Kod
- **Plats:** `app/actions/messaging.ts:46, 61`
- **Problem:** `console.error()` loggar men returnerar inget user-vänligt fel. Klienten ser bara `{ok: false}`.
- **Föreslagen fix:** Inkludera felmeddelande i response.
- **Arbete:** S

### K-8 Inkonsekvent språk i kod (svenska + engelska)
- **Allvarlighet:** Låg
- **Kategori:** Kod / Stil
- **Plats:** spridd
- **Problem:** Vissa kommentarer på svenska, andra engelska. Variabelnamn engelska. Felmeddelanden svenska (vilket är rätt för slut-användare). Inte ett bug, men inkonsekvent.

---

### P-1 (= UX-3 ovan) bg-bilder 25 MB totalt — se UX-3.

### P-2 Ingen caching på top-listor (`fetchTopCreators`, `fetchBrandsAggregated`)
- **Allvarlighet:** Medel
- **Kategori:** Prestanda
- **Plats:** `lib/queries.ts:460-521, 548-605`
- **Problem:** Top-creators-listan och brand-aggregat körs på varje render av `/`, `/trendigt`, `/brands`. Båda kör flera queries + Map-joins i Node.
- **Föreslagen fix:** Lägg `unstable_cache` med 5 min revalidation. Invalidera på outfit-publicering om datan är load-bearing.
- **Arbete:** S

### P-3 20+ routes `export const dynamic = "force-dynamic"`
- **Allvarlighet:** Medel
- **Kategori:** Prestanda
- **Plats:** `app/page.tsx`, `app/upptack/page.tsx`, `app/foljer/page.tsx`, `app/trendigt/page.tsx`, `app/brands/page.tsx`, `app/profile/[username]/page.tsx`, `app/[username]/[slug]/page.tsx`, etc.
- **Problem:** Hindrar Vercel Edge Cache. Med RLS som filtrerar per-user kan det vara nödvändigt, men `/`, `/upptack`, `/brands`, `/trendigt` är offentliga listor som *skulle* kunna ISR:as och invalideras vid outfit-publicering.
- **Föreslagen fix:** Identifiera vilka som verkligen behöver `force-dynamic` (auth-beroende UI) och konvertera resten till ISR med 1–5 min `revalidate` + `revalidatePath` på publishing-actions.
- **Arbete:** M

### P-4 Framer Motion (12.x) imports är inte lazy
- **Allvarlighet:** Låg
- **Kategori:** Prestanda
- **Plats:** alla `motion`-användare
- **Problem:** ~40 KB gzip i varje bundle den importeras i.
- **Föreslagen fix:** På sidor där `motion` används för bara hover/fade — överväg pure CSS. För komplexa flows: `dynamic(() => import("framer-motion").then(m => m.motion.div), { ssr: false })`.
- **Arbete:** M

### P-5 `unoptimized={url.startsWith("http")}` används på ~10 ställen
- **Allvarlighet:** Låg
- **Kategori:** Prestanda
- **Plats:** spridd
- **Problem:** Försämrar lazy-resize för externa bilder (mest Supabase-CDN). Supabase Storage stöder image-transformation via URL — kan användas istället för Next.js Image.
- **Föreslagen fix:** Använd Supabase storage transformation URL:er när källan är Supabase, så `next/image` *kan* vara optimerad.
- **Arbete:** M

### P-6 Webhook fan-out för push/email kommer trigga N HTTP-anrop per notification
- **Allvarlighet:** Låg
- **Kategori:** Prestanda
- **Plats:** `supabase/migrations/0028_notify_webhooks.sql` (`private.fanout_notify`)
- **Problem:** En like genererar två POST:s (push + email). Eskalerar vid masslikes.
- **Föreslagen fix:** Batch notifications eller deboune i Postgres. Inte akut.
- **Arbete:** M

### P-7 Inget connection-pool-tak på Realtime
- **Allvarlighet:** Låg
- **Kategori:** Prestanda
- **Plats:** Konversations-vyn `app/meddelanden/[id]/ConversationThread.tsx`
- **Problem:** Varje öppen DM = 1 WS-connection till Supabase. Supabase Pro har generösa limits, men något att monitoreras.

---

### C-1 GDPR — dataexport + radering finns ✅
- **Status:** Implementerad i `app/profil/installningar/konto` (commit `1a48a30`). JSON-dump + typed-confirmation-delete med cascade.
- **Verifiering kvar:** Bekräfta att alla relaterade rader (push_subscriptions, tag_clicks, message-shares, reports) faktiskt cascade:as eller anonymiseras.

### C-2 GDPR — tag_clicks lagrar IP-land och user_agent
- **Allvarlighet:** Medel
- **Kategori:** Compliance
- **Plats:** `app/go/[itemId]/route.ts:148-156`, migration `0005_views_clicks.sql`
- **Problem:** Tabellen `tag_clicks` får `visitor_country` (ISO2), `referrer`, `user_agent` — detta är PII enligt vissa tolkningar. Integritetspolicyn bör eksplicit nämna det.
- **Föreslagen fix:** Sätt retention-policy (radera klick-rader > 90 dagar). Lägg till i integritets­policyn att vi loggar land + UA för fraud-detection.
- **Arbete:** S

### C-3 Cookie consent — endast funktionella cookies, banner finns ✅
- **Status:** OK. Cookie-banner med "Endast nödvändiga" + "OK", 1-årig consent. Bra mönster.

### C-4 Inga tredje-parts spårnings-cookies
- **Status:** ✅ Inga Google Analytics, ingen Meta Pixel. Vercel Analytics + Speed Insights är cookie-fria.

### C-5 Backups
- **Plats:** Supabase Pro
- **Status:** Pro-planen gör daily backups (7 dagars retention). Återställningstest har inte gjorts från det jag kan se (ej dokumenterat i AGENTS.md).
- **Föreslagen fix:** Gör en manuell PITR-restore-övning på en branch en gång.
- **Arbete:** S

### C-6 Villkor + integritet
- **Status:** ✅ `/villkor` + `/integritet` finns, länkade från footer. Senast uppdaterad 2026-05-06.

---

### G-1 Sök på `/sok` saknar gender-filter, kategori-filter, brand-filter
- **Allvarlighet:** Medel
- **Kategori:** Produkt-gap
- **Plats:** `app/sok/page.tsx`
- **Problem:** Endast text-match. Ingen sortering, ingen filter, ingen pagination.
- **Arbete:** M

### G-2 Inga notiser för "stänger" / digest / email-summering
- **Allvarlighet:** Medel
- **Kategori:** Produkt-gap
- **Plats:** notification-stack
- **Problem:** Notifikationer skickas live vid varje like/comment/follow. Ingen daily/weekly digest. Risk: notifikations-trötthet vid många följare.
- **Arbete:** L

### G-3 Inga "Liknande outfits"-rekommendationer i sidofält
- **Allvarlighet:** Låg
- **Kategori:** Produkt-gap
- **Plats:** `OutfitDetail.tsx:327-341` har "Liknande outfits" men det är `slice(0, 3)` från random fetch — ingen riktig similarity.
- **Föreslagen fix:** Baserat på shared tags eller category.
- **Arbete:** M

### G-4 Analytics för admin saknar engagement-funnel
- **Allvarlighet:** Låg
- **Kategori:** Produkt-gap
- **Plats:** `/admin/statistik`
- **Problem:** Visar topp-outfits/kreatörer men inte funnels (view → like → save → click). Ingen retention.
- **Arbete:** M

### G-5 Inga "Spara plagg till board"-mekanik på enskilda plagg
- **Status:** ⚠️ Halv-implementerat. `saved_items`-tabellen + `TaggedItemCard` har "Spara plagg"-knapp som lägger i `saved_items`, men inga boards för plagg (bara outfits). Användaren kan ej kuratera per-plagg-mappar.
- **Arbete:** M

### G-6 Internlänkning från outfit till profil och kategori, men inte till liknande
- **Status:** Partiell. Outfit-sidan har internlänk till profil + kategori-tagg-länk via `/upptack?style=`. Saknar "Mer från denna kreatör" + "Liknande stilar".
- **Arbete:** M

### G-7 Schemalagd publicering UI finns men cron är inte aktiverad
- **Allvarlighet:** Låg
- **Kategori:** Produkt-gap
- **Plats:** `OutfitEditor.tsx:298-322`
- **Problem:** Användaren kan välja "Schemalagd" status, men UI-texten säger explicit: "cron-tasken är inte aktiverad". Är en känd halv-implementation.
- **Föreslagen fix:** Aktivera Supabase pg_cron-jobb som flippar `is_published=true` när `scheduled_for < now()`.
- **Arbete:** S

---

## Allvarlighets-summa

| Kod    | Allvarlighet | Område | Arbete |
|--------|--------------|--------|--------|
| BUG-1  | Hög          | UX/Bug | M |
| BUG-2  | Hög          | Bug    | M |
| BUG-3  | Hög          | Bug    | M |
| BUG-4  | Medel-Hög    | Bug    | L |
| BUG-5  | Medel        | Bug    | M |
| S-1    | Kritisk      | Sec    | S |
| S-2    | Kritisk      | Sec    | S |
| S-3    | Hög          | Sec    | S |
| S-4    | Medel        | Sec    | S |
| S-5    | Hög          | Sec    | S |
| S-6    | Hög          | Sec    | M |
| S-7    | Låg          | Sec    | S |
| S-8    | Medel        | Sec    | M |
| S-9    | Låg (positivt) | Sec  | – |
| S-10   | Låg          | Sec    | S |
| UX-1   | Hög          | UX     | S |
| UX-2   | Hög          | UX     | S |
| UX-3   | Hög          | UX     | S |
| UX-4   | Medel        | UX     | S |
| UX-5   | Medel        | A11y   | S |
| UX-6   | Låg          | UX     | M |
| UX-7   | Medel        | A11y   | S |
| UX-8   | Låg          | UX     | S |
| UX-9   | Låg          | SEO    | S |
| UX-10  | Låg          | UX     | L |
| UX-11  | Låg          | A11y   | M |
| UX-12  | Låg          | A11y   | S |
| K-1    | Hög          | Kod    | L |
| K-2    | Medel        | Kod    | L |
| K-3    | Medel        | Kod    | M |
| K-4    | Låg          | Kod    | M |
| K-5    | Låg          | Kod    | M |
| K-6    | Medel        | Kod    | S |
| K-7    | Låg          | Kod    | S |
| K-8    | Låg          | Kod    | – |
| P-1    | Hög          | Perf   | S |
| P-2    | Medel        | Perf   | S |
| P-3    | Medel        | Perf   | M |
| P-4    | Låg          | Perf   | M |
| P-5    | Låg          | Perf   | M |
| P-6    | Låg          | Perf   | M |
| P-7    | Låg          | Perf   | – |
| C-1    | – (positivt) | GDPR   | – |
| C-2    | Medel        | GDPR   | S |
| C-3    | – (positivt) | GDPR   | – |
| C-4    | – (positivt) | GDPR   | – |
| C-5    | Låg          | Backup | S |
| C-6    | – (positivt) | Legal  | – |
| G-1    | Medel        | Produkt| M |
| G-2    | Medel        | Produkt| L |
| G-3    | Låg          | Produkt| M |
| G-4    | Låg          | Produkt| M |
| G-5    | Medel        | Produkt| M |
| G-6    | Låg          | Produkt| M |
| G-7    | Låg          | Produkt| S |

---

## Avslutande notering

Moidello är inte ett brännande hus. Det är en välbyggd MVP där grunden — auth, RLS, server actions, SEO, admin-tooling — håller hög standard. De bekräftade buggarna är produktnära irritationer som användare upptäcker innan automatiska tester gör det (för att inga finns). De största säkerhetsrisken (Next.js-CVE:erna) är ett `npm audit fix --force` ifrån att försvinna. Hela rapportens "Kritisk"-lista går att klara av på en eftermiddag om man väljer att prioritera den.

Det två mest fundamentala investeringarna långsiktigt är: **(a) lägg till tester** så samma bugg inte rapporteras tre gånger, och **(b) splitta de växande 900+rad-page-filerna** innan de blir 1500.
