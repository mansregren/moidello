# Retailer modules

Each `.ts` file in this folder is a *retailer module* — a small adapter that
teaches Moidello how to extract product metadata from a retailer's HTML and
how to rewrite a product URL to the visitor's locale.

The 9 retailers currently shipped:

| Module          | Domain            | Rewrite style              | Locales |
|-----------------|-------------------|----------------------------|---------|
| `johnhenric.ts` | `johnhenric.com`  | path segment `/<2–3>/`     | 9 |
| `zalando.ts`    | `zalando.*` (TLD) | hostname swap              | 17 |
| `stories.ts`    | `stories.com`     | path segment `/en_xxx/`    | 14 |
| `hm.ts`         | `hm.com`          | path segment `/<lang>_<country>/` | 17 |
| `cos.ts`        | `cos.com`         | path segment `/en_xxx/`    | 15 |
| `arket.ts`      | `arket.com`       | path segment `/en_xxx/`    | 15 |
| `nakd.ts`       | `na-kd.com`       | path segment `/<lang>/` or `/<lang>-<country>/` | 12 |
| `nelly.ts`      | `nelly.com`       | path segment `/<2>/`       | 4 |
| `filippak.ts`   | `filippa-k.com`   | path segment `/<lang>-<country>/` | 15 |

There are also five *stub* retailers in `stubs.ts` (acnestudios, toteme,
ganni, sezane, mango) — they recognise the domain and tag the retailer-id
but don't rewrite URLs.

## How modules are used

1. `/api/admin/items/preview-from-url` calls `findRetailer(url)` when an
   admin pastes a product URL. The matched retailer's `extract()` returns
   brand/name/price/image/etc. plus `retailer` + `retailer_locale` which
   get persisted on the `tagged_items` row.
2. `/go/[itemId]` looks up the retailer via `getRetailerById()` and calls
   `rewriteForLocale(url, visitorLocale)` to swap the URL to the visitor's
   country before the 302 redirect. The rewrite is skipped for affiliate
   links and for retailers whose `supportedLocales` doesn't include the
   visitor's country.

## The `Retailer` interface (see `types.ts`)

```ts
interface Retailer {
  id: string;                  // stable id stored in DB (`tagged_items.retailer`)
  name: string;                // display name in admin UI
  domains: string[];           // hostnames (without protocol/www)
  supportedLocales: Locale[];  // locales we can rewrite TO
  match(url: URL): boolean;
  detectLocale(url: URL): Locale | null;
  rewriteForLocale(url: URL, target: Locale): URL;
  extract(html: string, url: URL): Promise<Partial<ProductMeta>>;
}
```

## Hard-won rules

These are mistakes we've shipped before. Don't repeat them.

### 1. `rewriteForLocale` must REPLACE, never PREPEND, when the URL already
   has any locale-shaped prefix.

The bug from 2026-05-13 (johnhenric `c3ded66`, nelly fixed in the same
audit pass): if you filter your path-segment detector by `SUPPORTED`, then
a URL with a *recognisable but non-target* locale (e.g. `/gb/`, `/en/`)
falls through to the prepend branch and produces `/se/gb/foo` — a 404
on the retailer.

**Correct pattern** (see `johnhenric.ts`):
```ts
// Detection set is WIDER than rewrite-target set.
const DETECTABLE_LOCALES = new Set([...SUPPORTED, "gb", "uk", "en", "eu"]);

function localeFromPath(pathname: string): Locale | null {
  const m = pathname.match(/^\/([a-z]{2,3})(\/|$)/i);
  if (!m) return null;
  const code = m[1].toLowerCase();
  return DETECTABLE_LOCALES.has(code) ? (code as Locale) : null;
}
```

**Even simpler pattern** (see `nelly.ts`, `stories.ts`, `hm.ts`): don't
filter at all — return whatever your regex matches. The rewrite logic
only needs to know WHAT segment to swap; whether the source is a "real"
locale is a separate concern for the rewrite *target*.

### 2. `rewriteForLocale` must be idempotent.

Calling `rewriteForLocale(url, target)` twice with the same target must
not double-encode the locale. The shared test matrix in `rewrite.test.ts`
asserts this for every module.

### 3. Affiliate links are NEVER rewritten.

`/go/[itemId]` skips `rewriteForLocale` when `item.is_affiliate === true`.
The retailer module never sees affiliate links because they're routed
around it. Your module can assume the URL is a clean product URL.

### 4. `match()` strips `www.` (and `www2.`) before comparing hostnames.

Customers paste both `www.example.com/foo` and `example.com/foo` URLs.
Both must match.

### 5. The `Locale` type is just `string`.

We use lowercase ISO-2 country codes (`se`, `no`, `dk`) plus the special
case `int` for John Henric's international fallback. Don't introduce mixed
case or 3-letter codes outside that one exception.

## Adding a new retailer

1. **Inspect the retailer's URL structure.** Open product pages from at
   least 3 different markets and note the pattern:
   - TLD-based: `zalando.se` / `zalando.dk` → use the `zalando.ts` template.
   - Path-based with locale segment: `hm.com/sv_se/...` → use the `hm.ts`
     template.
   - Mixed: rare; copy the closest match and adapt.

2. **Create `lib/retailers/<id>.ts`.** Copy the closest-matching existing
   module. Replace the `LOCALE_TO_SEGMENT` / TLD map with the retailer's
   own. Implement `match()`, `detectLocale()`, `rewriteForLocale()`,
   `extract()`.

3. **Wire it into `lib/retailers/index.ts`.** Add the import and put the
   instance in the `RETAILERS` array in roughly traffic order (most-used
   retailers first — `findRetailer` returns the first match).

4. **Add a row to `PATH_CASES` in `rewrite.test.ts`** (or extend the
   Zalando-specific block if it's TLD-based). Provide:
   - URLs for at least 3 locales of the same product
   - One bare URL with no locale segment
   - One `foreignLocaleUrl` whose first path segment is a locale the
     retailer doesn't rewrite TO (e.g. `/gb/...` for a Nordic-focused
     retailer). This catches the prepend-bug regression.

5. **Run `npm test`**. All 147+ tests must pass.

6. **Backfill existing rows.** If you launched the retailer for an already-
   active domain (e.g., users were already pasting URLs to it via the
   `Okänd retailer` stub path), write a one-off migration that does:
   ```sql
   update tagged_items
     set retailer = '<id>'
     where retailer is null and buy_url ilike '%<domain>%';
   ```
   See `0032_backfill_tagged_item_retailer.sql` for the canonical example.

7. **Remove the stub.** If your new retailer was previously a stub in
   `stubs.ts`, delete the stub export and the corresponding line in
   `index.ts`.

8. **Smoke-test the live `/go` redirect.** Find an existing tag with a
   buy_url pointing to your retailer, click "Köp" from outside the EU/SE
   (or test via `curl -H "x-vercel-ip-country: NO" ...`), and verify the
   `location` header points to the locale-rewritten URL.

## When to NOT add a full module

A stub is fine if all of these are true:
- The retailer doesn't have meaningful locale variants (e.g., USD-only).
- You don't need geo-rewrite for Moidello users.
- Open Graph metadata is sufficient for `extract()`.

Stubs cost almost nothing — they just put a retailer-id on the `tagged_items`
row for analytics and prevent "Okänd retailer"-warnings in admin.
