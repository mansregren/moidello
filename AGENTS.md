<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

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
