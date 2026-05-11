-- Reels Market core backend tables
-- Apply in Supabase SQL Editor after confirming the production/development project.

create table if not exists public.purchases (
  id text primary key,
  buyer_id text not null,
  seller_id text not null,
  video_id text not null,
  price integer not null,
  status text not null default 'paid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchases_buyer_id_created_at_idx
  on public.purchases (buyer_id, created_at);

create index if not exists purchases_seller_id_created_at_idx
  on public.purchases (seller_id, created_at);

create index if not exists purchases_video_id_idx
  on public.purchases (video_id);

create index if not exists purchases_buyer_id_video_id_status_idx
  on public.purchases (buyer_id, video_id, status);

create unique index if not exists purchases_one_paid_per_video_per_buyer_idx
  on public.purchases (buyer_id, video_id)
  where status = 'paid';

create table if not exists public.generation_jobs (
  id text primary key,
  user_id text not null,
  source_video_id text references public.videos(id) on delete set null,
  status text not null default 'queued',
  stage text not null default 'queued',
  progress integer not null default 0,
  input_json jsonb,
  provider_json jsonb,
  output_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists generation_jobs_user_id_created_at_idx
  on public.generation_jobs (user_id, created_at);

create index if not exists generation_jobs_status_updated_at_idx
  on public.generation_jobs (status, updated_at);

create index if not exists generation_jobs_source_video_id_idx
  on public.generation_jobs (source_video_id);

create table if not exists public.admin_audit_logs (
  id text primary key,
  actor_id text not null,
  actor_email text,
  action text not null,
  target_type text not null,
  target_id text not null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_actor_id_created_at_idx
  on public.admin_audit_logs (actor_id, created_at);

create index if not exists admin_audit_logs_target_type_target_id_idx
  on public.admin_audit_logs (target_type, target_id);

create table if not exists public.reports (
  id text primary key,
  reporter_id text,
  target_type text not null,
  target_id text not null,
  reason text not null,
  status text not null default 'open',
  assigned_admin_id text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_status_created_at_idx
  on public.reports (status, created_at);

create index if not exists reports_target_type_target_id_idx
  on public.reports (target_type, target_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_purchases_updated_at on public.purchases;
create trigger trg_purchases_updated_at
before update on public.purchases
for each row execute function public.set_updated_at();

drop trigger if exists trg_generation_jobs_updated_at on public.generation_jobs;
create trigger trg_generation_jobs_updated_at
before update on public.generation_jobs
for each row execute function public.set_updated_at();

drop trigger if exists trg_reports_updated_at on public.reports;
create trigger trg_reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

alter table public.purchases enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.reports enable row level security;

grant select, insert, update on table public.purchases to authenticated;
grant select, insert, update on table public.generation_jobs to authenticated;
grant select, insert on table public.reports to authenticated;
grant all on table public.purchases to service_role;
grant all on table public.generation_jobs to service_role;
grant all on table public.admin_audit_logs to service_role;
grant all on table public.reports to service_role;

drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own"
on public.purchases for select
using (auth.uid()::text = buyer_id or auth.uid()::text = seller_id);

drop policy if exists "generation_jobs_select_own" on public.generation_jobs;
create policy "generation_jobs_select_own"
on public.generation_jobs for select
using (auth.uid()::text = user_id);

drop policy if exists "generation_jobs_insert_own" on public.generation_jobs;
create policy "generation_jobs_insert_own"
on public.generation_jobs for insert
with check (auth.uid()::text = user_id);

drop policy if exists "reports_insert_authenticated" on public.reports;
create policy "reports_insert_authenticated"
on public.reports for insert
with check (reporter_id is null or auth.uid()::text = reporter_id);

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own"
on public.reports for select
using (reporter_id is not null and auth.uid()::text = reporter_id);
