<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Aktuell status

Senast uppdaterad: 2026-05-13 — "fixa allt"-session: activity feed på /, drag-position i admin, 2FA, push/email auto-leverans-trigger (0028).

### 2026-05-13-leveranser (ej committade ännu)

- **Activity feed på `/`** — inloggade som följer någon ser "Från dina följda" som första section i `app/HomeClient.tsx`. Tom array = ingen section. Backas av `fetchFollowingFeed` (12 outfits) och gender-filtrering via klient-context.
- **Drag-position i `/admin/inlagg/[id]`** — bilden ersatt med `TagPositionEditor` (i `OutfitEditor.tsx`). Punkterna är draggbara, ändrade punkter blir bärnstensfärgade tills man trycker "Spara". Server-action: `updateTaggedItemPosition`.
- **2FA / TOTP** — ny `components/settings/TwoFactorSettings.tsx` inbäddad på `/profil/installningar/konto`. Använder Supabase `auth.mfa.enroll/challenge/verify/unenroll` direkt från browser-clienten. Visar Supabase's SVG-QR + secret för manuell entry.
- **Push/email auto-leverans** — migration `0028_notify_webhooks.sql` skapar `pg_net`-extension, `private.app_settings`-tabell, helpers `private.post_notify` + `private.fanout_notify`. Triggers `notify_on_like/follow/comment` utökade att fan-out till `/api/push/notify` och `/api/email/notify`. Ny `notify_on_message`-trigger för DMs (skickar bara webhook, inga notifications-rader).
- **Push notify-route** — refaktorerad till `{user_id, kind, actor_id?, outfit_id?, comment_id?}`-shape (samma som email-routen). Resolver display_name + outfit-URL server-side och bygger title/body i svenska.

### Att göra själv efter pull (Mans)

1. **Pusha migrationen** — `npx supabase db push` (blockerad i sandbox av Claude).
2. **Sätt env vars i Vercel** (alla tre miljöer):
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=BG-6i-6eA5Ukxmi-Kq_VdcAfj_blLCUNcrKQh2q6k5bRQXAOKET1Krm_MKfiZ-LGVjADXNimJ8tRTawXOOwmvpM
   VAPID_PRIVATE_KEY=1mij4Ji6OaKKi40T5gBUdET3-yW0cvHI_xPAZrrCSoo
   VAPID_SUBJECT=mailto:hello@moidello.com
   PUSH_WEBHOOK_SECRET=26c7fd256d6858111e6e9d9a4b7ee0e078d88c42f76ffc0ee649cbdb175f89e7
   ```
   Plus `RESEND_API_KEY` när Resend-kontot finns + domänen är verifierad.
3. **Fyll i settings-tabellen i Supabase SQL Editor:**
   ```sql
   insert into private.app_settings (key, value) values
     ('base_url', 'https://moidello.com'),
     ('push_webhook_secret', '26c7fd256d6858111e6e9d9a4b7ee0e078d88c42f76ffc0ee649cbdb175f89e7');
   ```
4. **Skapa Resend-konto** + verifiera moidello.com-domänen (DNS-records).
5. **Verifiera i prod** — lika + kommentera + meddela en annan användare och kolla att push-notiser landar; samma för mail när Resend är upp.

### Sessionens leveranser (alla på `main`, deployat via Vercel)

**Säkerhet + databas:**
- `bc5d3fc` — Switch 5 SECURITY DEFINER views to invoker (Supabase Advisor CRITICAL × 5 fixade). Bevarad public save-count via ny `outfit_save_counts`-tabell + trigger. Brand-dashboard via scoped tag_clicks-RLS istället för definer-bypass.

**Sociala features:**
- `db7c8ec` — Följer/Följare som riktiga tabs på profilsidor (räknen nu klickbara, hela listor med FollowButton per rad).
- `44245c9` — `/go/[itemId]` server-side click-tracking wrapper. Alla Köp-knappar routar genom den nu; recordTagClick borttaget från klient.
- `70d713e` — Rapportera-funktion. `reports`-tabell, modal med 7 svenska anledningar, entry points på outfits/kommentarer/profiler. RLS: reporter-only read.
- `1a48a30` — Konto-radera + dataexport (GDPR). `/profil/installningar/konto` med JSON-dump + typed-confirmation-delete (cascade).
- `2908d49` — Global sök `/sok` över profiler/märken/outfits via Header-fältet.
- `ad0e22c` — Push notifications infrastruktur: `push_subscriptions`-tabell, `/sw.js`, PushToggle, `/api/push/notify` med X-Push-Secret. Auto-leverans behöver Database Webhook eller pg_net-trigger (ej aktiverat).

**Skapa-flow:**
- `14eb340` → `8a3c8cf` → `4d15d08` — Multi-image-upload på `/skapa`. Tabb-rad högst upp med thumbnails, drag-and-drop flera bilder, tagga per bild, publicera alla i sekvens (en createOutfit per bild så body-limit aldrig slår till). Varje outfit får egen `/<username>/<slug>`-URL.
- `26af855` — Brand-product autocomplete i tag-formen. När du skriver märke söks `brand_products` och klick på träff fyller brand/namn/buy_url på en gång.

**Märken:**
- `7af2860` — Bulk CSV-import för märken. `brand_products`-tabell (RLS: aktiva rader publika, owner full CRUD), `/brand-dashboard/import` med inline CSV-parser (kvotade fält stöds, max 500 rader). Katalog visas under "Officiell katalog" på `/brand/[slug]`.

**Navigation:**
- `adec89d` — `/foljer`-route ersätter `/trendigt` i nav. Tre lägen: feed från följda, förslag på kreatörer (om noll följs), förslag (utloggad). `/trendigt`-routen lever kvar orörd för senare comeback.

**Admin-panel (12 sub-features):**
- `6dbefe7` — `/admin` dashboard + `/admin/anmalningar` queue. `is_admin` på profiles, founding-email seedad. RLS-policies för admin-läsning av reports + update. Externa länkar till Vercel/Search Console/Supabase.
- `c63ff66` → `9265231` → `0eb5f0e` → `60a23e6` — User mgmt: lista med filter (Riktiga/Demo/Märken/Admins), impersonate via cookie+RLS (admin posts som annan user via `/skapa`, banner högst upp, återgå-knapp), seed 8 demo-kreatörer, ny användare via service-role, edit-modal med file-upload-avatar, per-user detalj-sida `/admin/anvandare/[id]` med 8-card stats grid + edit-form (region/socials/brand).
- `a1e8e42` — Inläggs-hantering: `/admin/inlagg` (sortbar på views/likes/saves/clicks/comments/date), per-outfit workbench `/admin/inlagg/[id]` med stats + edit + tag-redigering + per-tag click count + radera.
- `1073ba8` — `/admin/statistik` med 4 sparkline-kort (30d), top-10 outfits per metrik, top-10 kreatörer/märken.

**UX-polish:**
- `03a489b` → `98c98d7` → `21d5ba7` — Background-rotation per session via cookie-seed (sätts i proxy.ts), `HERO_POOL` med 7 ursprungliga seed-bilder för front-of-house. Lägger 4 unsplash-bilder i `/public` men inte i poolen.
- `fdcc2e9` — Cookie consent-banner bottom-right, 1-årig consent-cookie, länkar till `/integritet`.

**E-post:**
- `6a45bcb` — Resend SDK + `lib/email/{client,templates}.ts` (welcome/follower/comment/message). `/api/email/notify`-webhook mirror av push-routen (samma payload-shape så en Supabase webhook kan trigga båda). Fail-soft när RESEND_API_KEY saknas.

### Migrations 0021–0027 (alla applyade i prod)

- 0021 security_invoker_views + outfit_save_counts
- 0022 reports
- 0023 push_subscriptions
- 0024 brand_products
- 0025 admin (is_admin på profiles + seed Mans)
- 0026 admin_impersonation (RLS för impersonation + storage)
- 0027 admin_user_detail (is_demo + avatar admin storage)

### Att verifiera när användaren testar i prod

1. **DM E2E A→B→A** — kvar från förra sessionen, fortfarande inte verifierat.
2. **OG-bild preview** — kvar från förra sessionen, fortfarande inte verifierat.
3. **Admin v2 features** — Mans har just satt SUPABASE_SERVICE_ROLE_KEY i Vercel. Testa:
   - Seed 8 demo-kreatörer-knappen
   - Skapa ny användare via modalen
   - Radera ett konto
   - Impersonera och posta en outfit → kolla banner + att outfit hamnar hos rätt user
4. **Background rotation** — öppna i inkognito två gånger, ska få olika bilder.
5. **Cookie banner** — radera consent-cookie, ladda om, banner ska komma tillbaka.

### Env vars Mans måste sätta för full funktionalitet

I Vercel Project Settings → Environment Variables (alla tre miljöer) + `.env.local`:

| Variabel | För | Status |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Admin user create/delete + push send | ✅ Satt 2026-05-11 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push-prenumeration i klient | ⏳ Saknas. Genereras med `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Push-leverans server-side | ⏳ Saknas. Från samma kommando |
| `VAPID_SUBJECT` | Web Push contact | ⏳ Saknas. `mailto:hello@moidello.com` |
| `PUSH_WEBHOOK_SECRET` | Auth för `/api/push/notify` + `/api/email/notify` | ⏳ Saknas. Random hex-sträng |
| `RESEND_API_KEY` | Transactional email via Resend | ⏳ Saknas. Skapa konto + verifiera moidello.com-domän |
| `MOIDELLO_EMAIL_FROM` | From-adress | Valfri. Default: `Moidello <hello@moidello.com>` |

### Push + email auto-leverans (slutsteget, behöver Mans-input)

Båda webhooks är klara på vår sida (`/api/push/notify`, `/api/email/notify`). Saknas: en trigger som anropar dem när rad inserts:as i `notifications`-tabellen. Två vägar:

1. **Supabase Database Webhook** (Supabase Dashboard → Database → Webhooks) — pekar på Vercel-URL:erna, lägg `X-Push-Secret`-header. Custom payload-mapping krävs för att översätta `record.{user_id, type, actor_id, ...}` till våra shapes.
2. **pg_net.http_post i triggerfunktionerna `notify_on_*`** i 0010 — kräver lagrad secret i Vault och http_post-anrop. Mer kontroll, mer SQL.

### Nästa stora bitar i kö

1. **Push/email auto-leverans** — när Mans satt VAPID + Resend + valt webhook eller pg_net.
2. **Activity feed på `/`** — för inloggade som följer någon, visa senaste från följda högt upp på hemsidan.
3. **Outfit-edit med drag-position i admin** — tag-pinning kan flyttas i `/skapa` men inte i `/admin/inlagg/[id]`. Kopiera positionsdragget dit.
4. **2FA i auth-settings** — Supabase stödjer det, UI-arbete i `/profil/installningar`.
5. **Trendigt återinförd när det finns aktivitet** — `/trendigt`-routen lever kvar; lägg tillbaka i `lib/nav.ts` när rankings är meningsfulla.

### Notiser inom appen

`notifications`-tabellen får triggers från likes/follows/comments (migration 0010). Det betyder att in-app-bell fungerar redan. **Push** och **email** ovanpå det är vad som ännu inte triggrar — det är den sista pluggen för full notification-stack.

### UGC-länksäkerhet

Alla utgående länkar som innehåller eller pekar mot användar-genererat innehåll (köp-länkar i taggade plagg, sociala media-länkar i bios, kommentarer som länkar) ska wrappas i `<UserLink>` (`components/shared/UserLink.tsx`). Komponenten sätter automatiskt `rel="ugc nofollow noopener noreferrer"` + `target="_blank"`. Använd inte rå `<a target="_blank" href="...">` för UGC-länkar.



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
