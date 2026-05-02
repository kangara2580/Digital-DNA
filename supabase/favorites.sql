-- 마켓플레이스 찜(wishlist) · 좋아요(like) — Supabase SQL Editor에서 1회 실행하세요.

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id text not null,
  kind text not null check (kind in ('wishlist', 'like')),
  created_at timestamptz not null default now(),
  unique (user_id, video_id, kind)
);

create index if not exists favorites_user_kind_created_idx
  on public.favorites (user_id, kind, created_at desc);

create index if not exists favorites_user_video_idx
  on public.favorites (user_id, video_id);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
on public.favorites
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
on public.favorites
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
on public.favorites
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- SQL Editor로만 만든 테이블은 Table Editor와 달리 역할 권한이 없을 수 있음 → API(anon JWT 경유)에서 permission denied 방지
grant select, insert, delete on table public.favorites to authenticated;
grant all on table public.favorites to service_role;
