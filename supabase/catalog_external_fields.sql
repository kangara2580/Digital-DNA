-- Catalog external source fields
-- Keeps original TikTok/YouTube/Instagram page links and canonical ids in videos.

alter table public.videos
  add column if not exists source_page_url text,
  add column if not exists external_provider text,
  add column if not exists external_key text;

create index if not exists videos_external_provider_external_key_idx
  on public.videos (external_provider, external_key);

