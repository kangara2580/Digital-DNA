-- =============================================================================
-- 증상: POST .../rest/v1/favorites → 403 PostgreSQL 42501
--       "new row violates row-level security policy for table \"favorites\""
--
-- 브라우저·앱 코드가 아니라 Supabase 에 이미 존재하는 public.favorites RLS 설정을
-- 갱신하는 스크립트입니다. 적용 방법:
--
--   1. Supabase Dashboard → SQL Editor 에 붙여넣기 → Run (한 번 실행)
--   2. 로컬/리포에서는 supabase/favorites.sql 과 동일한 정책으로 맞춤
--
-- 참고:
-- - (select auth.uid()) 는 RLS 재평가·문서 예시와 맞추기 위해 권장되는 형태입니다.
-- - 로그인한 세션 역할만 허용하려고 to authenticated 로 한정했습니다.
-- =============================================================================

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
drop policy if exists "favorites_insert_own" on public.favorites;
drop policy if exists "favorites_delete_own" on public.favorites;

create policy "favorites_select_own"
on public.favorites
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "favorites_insert_own"
on public.favorites
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "favorites_delete_own"
on public.favorites
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, delete on table public.favorites to authenticated;
grant all on table public.favorites to service_role;
