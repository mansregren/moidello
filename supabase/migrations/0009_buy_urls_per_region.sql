-- Per-region buy URLs. Stored as a jsonb map from ISO country code → URL,
-- e.g. {"SE": "https://...se/...", "NO": "https://...no/..."}.
-- The legacy buy_url column stays as the canonical fallback so older outfits
-- keep working unchanged. The TaggedItem renderer prefers buy_urls[viewer
-- region] when present, otherwise falls back to buy_url.

alter table public.tagged_items
  add column buy_urls jsonb;

create index tagged_items_buy_urls_idx
  on public.tagged_items using gin (buy_urls)
  where buy_urls is not null;
