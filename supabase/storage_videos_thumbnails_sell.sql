-- Supabase Storage: `videos`, `thumbnails` 버킷에 판매자 업로드(sell/{user_id}/...) 허용
-- 대시보드에서 버킷 생성 후 이 스크립트를 실행하세요. 버킷을 Public으로 두면 getPublicUrl로 바로 재생·표시됩니다.

-- 기존 정책 이름 충돌 시 DROP 후 재실행하세요.

-- videos / thumbnails: 누구나 읽기 (마켓 노출)
drop policy if exists "Public read videos bucket" on storage.objects;
create policy "Public read videos bucket"
  on storage.objects for select
  using (bucket_id = 'videos');

drop policy if exists "Public read thumbnails bucket" on storage.objects;
create policy "Public read thumbnails bucket"
  on storage.objects for select
  using (bucket_id = 'thumbnails');

-- 인증 사용자: sell/{자신의 uid}/ 경로에만 업로드·수정·삭제 (name 예: sell/<uid>/file.mp4)
drop policy if exists "Sell folder insert own videos" on storage.objects;
create policy "Sell folder insert own videos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'videos'
    and split_part(name, '/', 1) = 'sell'
    and split_part(name, '/', 2) = (auth.uid())::text
  );

drop policy if exists "Sell folder update own videos" on storage.objects;
create policy "Sell folder update own videos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'videos'
    and split_part(name, '/', 1) = 'sell'
    and split_part(name, '/', 2) = (auth.uid())::text
  );

drop policy if exists "Sell folder delete own videos" on storage.objects;
create policy "Sell folder delete own videos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'videos'
    and split_part(name, '/', 1) = 'sell'
    and split_part(name, '/', 2) = (auth.uid())::text
  );

drop policy if exists "Sell folder insert own thumbnails" on storage.objects;
create policy "Sell folder insert own thumbnails"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'thumbnails'
    and split_part(name, '/', 1) = 'sell'
    and split_part(name, '/', 2) = (auth.uid())::text
  );

drop policy if exists "Sell folder update own thumbnails" on storage.objects;
create policy "Sell folder update own thumbnails"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'thumbnails'
    and split_part(name, '/', 1) = 'sell'
    and split_part(name, '/', 2) = (auth.uid())::text
  );

drop policy if exists "Sell folder delete own thumbnails" on storage.objects;
create policy "Sell folder delete own thumbnails"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'thumbnails'
    and split_part(name, '/', 1) = 'sell'
    and split_part(name, '/', 2) = (auth.uid())::text
  );
