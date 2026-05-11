alter table public.videos
  add column if not exists processed_video_url text,
  add column if not exists processed_video_status text not null default 'pending',
  add column if not exists processed_video_error text;

create index if not exists videos_processed_video_status_idx
  on public.videos (processed_video_status);
