-- 로그인 사용자 장바구니·최근 본·데모 구매·커스터마이즈 임시저장·앱 blob(스튜디오 기록 등)
-- Supabase SQL Editor에서 favorites / profiles 와 함께 또는 별도로 1회 실행하세요.

-- 장바구니(DNA 빌더 타임라인)
create table if not exists public.user_cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id text not null,
  video jsonb not null,
  sort_index int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, video_id)
);

create index if not exists user_cart_items_user_sort_idx
  on public.user_cart_items (user_id, sort_index);

-- 최근 본 릴스
create table if not exists public.user_recent_views (
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id text not null,
  viewed_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create index if not exists user_recent_views_user_viewed_idx
  on public.user_recent_views (user_id, viewed_at desc);

-- 데모용 구매(모션 권리) 완료 ID
create table if not exists public.user_demo_purchases (
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

-- 창작 스튜디오 임시 저장 본문
create table if not exists public.user_customize_drafts (
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

-- 소량 JSON blob (예: 마이 스튜디오 생성 기록 배열)
create table if not exists public.user_data_blobs (
  user_id uuid not null references auth.users (id) on delete cascade,
  blob_key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, blob_key)
);

alter table public.user_cart_items enable row level security;
alter table public.user_recent_views enable row level security;
alter table public.user_demo_purchases enable row level security;
alter table public.user_customize_drafts enable row level security;
alter table public.user_data_blobs enable row level security;

-- user_cart_items
drop policy if exists "user_cart_select_own" on public.user_cart_items;
create policy "user_cart_select_own"
on public.user_cart_items for select using (auth.uid() = user_id);

drop policy if exists "user_cart_insert_own" on public.user_cart_items;
create policy "user_cart_insert_own"
on public.user_cart_items for insert with check (auth.uid() = user_id);

drop policy if exists "user_cart_update_own" on public.user_cart_items;
create policy "user_cart_update_own"
on public.user_cart_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_cart_delete_own" on public.user_cart_items;
create policy "user_cart_delete_own"
on public.user_cart_items for delete using (auth.uid() = user_id);

-- user_recent_views
drop policy if exists "user_recent_select_own" on public.user_recent_views;
create policy "user_recent_select_own"
on public.user_recent_views for select using (auth.uid() = user_id);

drop policy if exists "user_recent_insert_own" on public.user_recent_views;
create policy "user_recent_insert_own"
on public.user_recent_views for insert with check (auth.uid() = user_id);

drop policy if exists "user_recent_update_own" on public.user_recent_views;
create policy "user_recent_update_own"
on public.user_recent_views for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_recent_delete_own" on public.user_recent_views;
create policy "user_recent_delete_own"
on public.user_recent_views for delete using (auth.uid() = user_id);

-- user_demo_purchases
drop policy if exists "user_purchases_select_own" on public.user_demo_purchases;
create policy "user_purchases_select_own"
on public.user_demo_purchases for select using (auth.uid() = user_id);

drop policy if exists "user_purchases_insert_own" on public.user_demo_purchases;
create policy "user_purchases_insert_own"
on public.user_demo_purchases for insert with check (auth.uid() = user_id);

drop policy if exists "user_purchases_delete_own" on public.user_demo_purchases;
create policy "user_purchases_delete_own"
on public.user_demo_purchases for delete using (auth.uid() = user_id);

-- user_customize_drafts
drop policy if exists "user_drafts_select_own" on public.user_customize_drafts;
create policy "user_drafts_select_own"
on public.user_customize_drafts for select using (auth.uid() = user_id);

drop policy if exists "user_drafts_insert_own" on public.user_customize_drafts;
create policy "user_drafts_insert_own"
on public.user_customize_drafts for insert with check (auth.uid() = user_id);

drop policy if exists "user_drafts_update_own" on public.user_customize_drafts;
create policy "user_drafts_update_own"
on public.user_customize_drafts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_drafts_delete_own" on public.user_customize_drafts;
create policy "user_drafts_delete_own"
on public.user_customize_drafts for delete using (auth.uid() = user_id);

-- user_data_blobs
drop policy if exists "user_blobs_select_own" on public.user_data_blobs;
create policy "user_blobs_select_own"
on public.user_data_blobs for select using (auth.uid() = user_id);

drop policy if exists "user_blobs_insert_own" on public.user_data_blobs;
create policy "user_blobs_insert_own"
on public.user_data_blobs for insert with check (auth.uid() = user_id);

drop policy if exists "user_blobs_update_own" on public.user_data_blobs;
create policy "user_blobs_update_own"
on public.user_data_blobs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_blobs_delete_own" on public.user_data_blobs;
create policy "user_blobs_delete_own"
on public.user_data_blobs for delete using (auth.uid() = user_id);
