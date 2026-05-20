-- 프로필 사진: Supabase Dashboard → Storage → New bucket → 이름 `avatars`, Public 체크
-- 그 다음 이 SQL을 SQL Editor에서 1회 실행하세요.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read avatars bucket" on storage.objects;
create policy "Public read avatars bucket"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = (auth.uid())::text
  );

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = (auth.uid())::text
  );
