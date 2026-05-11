-- Keep public.profiles synchronized with Supabase Auth users.
-- Run once in Supabase SQL Editor or with Prisma db execute.

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    user_id,
    email,
    nickname,
    first_name,
    last_name,
    avatar_custom,
    updated_at
  )
  values (
    new.id,
    nullif(new.email, ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nickname', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', '')
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'first_name', ''),
      nullif(new.raw_user_meta_data ->> 'given_name', '')
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'last_name', ''),
      nullif(new.raw_user_meta_data ->> 'family_name', '')
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'avatar_custom', ''),
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', '')
    ),
    now()
  )
  on conflict (user_id) do update
  set
    email = coalesce(excluded.email, public.profiles.email),
    nickname = coalesce(public.profiles.nickname, excluded.nickname),
    first_name = coalesce(public.profiles.first_name, excluded.first_name),
    last_name = coalesce(public.profiles.last_name, excluded.last_name),
    avatar_custom = coalesce(public.profiles.avatar_custom, excluded.avatar_custom),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_sync_profile_from_auth_user on auth.users;
create trigger trg_sync_profile_from_auth_user
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_profile_from_auth_user();

insert into public.profiles (
  user_id,
  email,
  nickname,
  first_name,
  last_name,
  avatar_custom,
  updated_at
)
select
  u.id,
  nullif(u.email, ''),
  coalesce(
    nullif(u.raw_user_meta_data ->> 'nickname', ''),
    nullif(u.raw_user_meta_data ->> 'name', ''),
    nullif(u.raw_user_meta_data ->> 'full_name', '')
  ),
  coalesce(
    nullif(u.raw_user_meta_data ->> 'first_name', ''),
    nullif(u.raw_user_meta_data ->> 'given_name', '')
  ),
  coalesce(
    nullif(u.raw_user_meta_data ->> 'last_name', ''),
    nullif(u.raw_user_meta_data ->> 'family_name', '')
  ),
  coalesce(
    nullif(u.raw_user_meta_data ->> 'avatar_custom', ''),
    nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(u.raw_user_meta_data ->> 'picture', '')
  ),
  now()
from auth.users u
on conflict (user_id) do update
set
  email = coalesce(excluded.email, public.profiles.email),
  nickname = coalesce(public.profiles.nickname, excluded.nickname),
  first_name = coalesce(public.profiles.first_name, excluded.first_name),
  last_name = coalesce(public.profiles.last_name, excluded.last_name),
  avatar_custom = coalesce(public.profiles.avatar_custom, excluded.avatar_custom),
  updated_at = now();
