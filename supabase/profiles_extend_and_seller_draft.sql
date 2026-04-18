-- profiles 확장(얼굴 3면 JSON) + 판매 업로드 폼 임시 저장
-- Supabase SQL Editor에서 1회 실행하세요.

alter table public.profiles
  add column if not exists face_profile_json jsonb;

comment on column public.profiles.face_profile_json is
  '마이페이지 3면/AI 얼굴 프로필(JSON). 클라이언트 StoredFaceProfile 스키마.';

-- 판매자 릴스 등록 폼 임시 저장(파일 본문은 저장하지 않음 — 메타만)
create table if not exists public.seller_upload_drafts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_seller_upload_drafts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_seller_upload_drafts_updated_at on public.seller_upload_drafts;
create trigger trg_seller_upload_drafts_updated_at
before update on public.seller_upload_drafts
for each row execute function public.set_seller_upload_drafts_updated_at();

alter table public.seller_upload_drafts enable row level security;

drop policy if exists "seller_drafts_select_own" on public.seller_upload_drafts;
create policy "seller_drafts_select_own"
on public.seller_upload_drafts for select
using (auth.uid() = user_id);

drop policy if exists "seller_drafts_insert_own" on public.seller_upload_drafts;
create policy "seller_drafts_insert_own"
on public.seller_upload_drafts for insert
with check (auth.uid() = user_id);

drop policy if exists "seller_drafts_update_own" on public.seller_upload_drafts;
create policy "seller_drafts_update_own"
on public.seller_upload_drafts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "seller_drafts_delete_own" on public.seller_upload_drafts;
create policy "seller_drafts_delete_own"
on public.seller_upload_drafts for delete
using (auth.uid() = user_id);
