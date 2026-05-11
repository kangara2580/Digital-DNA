-- Admin operations foundation
-- Adds moderation state to videos and DB indexes used by the Admin console.

alter table public.videos
  add column if not exists status text not null default 'approved',
  add column if not exists moderation_reason text,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by text;

update public.videos
set status = 'approved'
where status is null;

create index if not exists videos_status_created_at_idx
  on public.videos (status, created_at);

create index if not exists reports_status_updated_at_idx
  on public.reports (status, updated_at);

create index if not exists purchases_status_created_at_idx
  on public.purchases (status, created_at);

