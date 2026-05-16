-- Cachad TikTok-text per outfit (rubrik, beskrivning, hashtags).
-- Genereras via Claude API i admin-flödet, sparas så vi inte regenererar
-- konstant. Shape: { title: string, description: string, hashtags: string[] }.
alter table public.outfits
  add column if not exists tiktok_caption_json jsonb;

comment on column public.outfits.tiktok_caption_json is
  'Cached TikTok-caption: { title, description, hashtags[] }. Populated by /api/admin/tiktok-caption/[id], used by /admin/tiktok-bilder modal.';
