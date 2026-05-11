-- Editing foundation
-- Adds content change logs and admin notes for operational editing history.

create table if not exists public.admin_notes (
  id text primary key,
  target_type text not null,
  target_id text not null,
  body text not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_notes_target_type_target_id_created_at_idx
  on public.admin_notes (target_type, target_id, created_at);

create index if not exists admin_notes_created_by_created_at_idx
  on public.admin_notes (created_by, created_at);

create table if not exists public.content_change_logs (
  id text primary key,
  target_type text not null,
  target_id text not null,
  actor_id text not null,
  actor_type text not null,
  change_type text not null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists content_change_logs_target_type_target_id_created_at_idx
  on public.content_change_logs (target_type, target_id, created_at);

create index if not exists content_change_logs_actor_id_created_at_idx
  on public.content_change_logs (actor_id, created_at);

alter table public.admin_notes enable row level security;
alter table public.content_change_logs enable row level security;

grant all on table public.admin_notes to service_role;
grant all on table public.content_change_logs to service_role;

