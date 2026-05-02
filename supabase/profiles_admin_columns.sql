-- Admin member management columns.
-- Run in Supabase SQL Editor if the app cannot auto-migrate.

alter table public.profiles
  add column if not exists account_status text not null default 'active',
  add column if not exists role text not null default 'user',
  add column if not exists admin_memo text,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by text;

create index if not exists profiles_account_status_updated_at_idx
  on public.profiles (account_status, updated_at);

create index if not exists profiles_role_updated_at_idx
  on public.profiles (role, updated_at);

comment on column public.profiles.account_status is
  'Admin-managed member status: active, suspended, deleted';

comment on column public.profiles.role is
  'Admin-managed member role: user, seller, admin, super_admin';

comment on column public.profiles.admin_memo is
  'Internal admin memo for member support and moderation.';
