-- Toss Payments commerce ledger for ARA.
-- This keeps payment, refund, seller earnings, platform fees, and settlement state auditable.

alter table if exists public.payments
  add column if not exists provider_payment_key text unique,
  add column if not exists order_name text,
  add column if not exists target_id text;

alter table if exists public.payments
  alter column currency set default 'KRW';

create table if not exists public.payment_events (
  id text primary key,
  payment_id text references public.payments(id) on delete set null,
  provider text not null,
  event_type text not null,
  provider_event_id text,
  order_id text,
  payment_key text,
  status text,
  raw_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_entitlements (
  id text primary key,
  user_id text not null,
  source_type text not null,
  source_id text not null,
  purchase_id text,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_type, source_id)
);

create table if not exists public.refund_requests (
  id text primary key,
  requester_id text not null,
  payment_id text,
  purchase_id text,
  reason text not null,
  detail text,
  status text not null default 'requested',
  admin_memo text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.refunds (
  id text primary key,
  payment_id text not null references public.payments(id) on delete cascade,
  refund_request_id text,
  provider text not null default 'toss',
  provider_refund_key text,
  amount_cents integer not null,
  currency text not null default 'KRW',
  reason text not null,
  status text not null default 'succeeded',
  provider_raw_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.seller_earnings (
  id text primary key,
  seller_id text not null,
  buyer_id text not null,
  purchase_id text not null unique,
  payment_id text,
  video_id text not null,
  gross_amount integer not null,
  platform_fee integer not null,
  net_amount integer not null,
  fee_rate_bps integer not null default 1000,
  status text not null default 'pending',
  available_at timestamptz not null,
  settlement_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_fees (
  id text primary key,
  payment_id text,
  purchase_id text,
  seller_id text,
  amount integer not null,
  currency text not null default 'KRW',
  fee_rate_bps integer not null,
  status text not null default 'earned',
  created_at timestamptz not null default now()
);

create table if not exists public.seller_settlement_requests (
  id text primary key,
  seller_id text not null,
  amount integer not null,
  currency text not null default 'KRW',
  bank_name text,
  account_no text,
  account_holder text,
  status text not null default 'requested',
  admin_memo text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_settlements (
  id text primary key,
  seller_id text not null,
  settlement_request_id text,
  amount integer not null,
  currency text not null default 'KRW',
  status text not null default 'approved',
  method text not null default 'manual',
  admin_memo text,
  processed_by text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_provider_payment_key_idx
  on public.payments(provider_payment_key);

create index if not exists payments_target_id_idx
  on public.payments(target_id);

create index if not exists payment_events_payment_id_created_at_idx
  on public.payment_events(payment_id, created_at);

create index if not exists payment_events_provider_event_type_created_at_idx
  on public.payment_events(provider, event_type, created_at);

create index if not exists payment_events_order_id_idx
  on public.payment_events(order_id);

create index if not exists payment_events_payment_key_idx
  on public.payment_events(payment_key);

create index if not exists user_entitlements_user_id_status_idx
  on public.user_entitlements(user_id, status);

create index if not exists user_entitlements_purchase_id_idx
  on public.user_entitlements(purchase_id);

create index if not exists refund_requests_requester_id_created_at_idx
  on public.refund_requests(requester_id, created_at);

create index if not exists refund_requests_status_created_at_idx
  on public.refund_requests(status, created_at);

create index if not exists refunds_payment_id_created_at_idx
  on public.refunds(payment_id, created_at);

create index if not exists seller_earnings_seller_id_status_available_at_idx
  on public.seller_earnings(seller_id, status, available_at);

create index if not exists seller_earnings_payment_id_idx
  on public.seller_earnings(payment_id);

create index if not exists seller_earnings_video_id_idx
  on public.seller_earnings(video_id);

create index if not exists platform_fees_payment_id_idx
  on public.platform_fees(payment_id);

create index if not exists platform_fees_purchase_id_idx
  on public.platform_fees(purchase_id);

create index if not exists platform_fees_seller_id_created_at_idx
  on public.platform_fees(seller_id, created_at);

create index if not exists seller_settlement_requests_seller_id_created_at_idx
  on public.seller_settlement_requests(seller_id, created_at);

create index if not exists seller_settlement_requests_status_created_at_idx
  on public.seller_settlement_requests(status, created_at);

create index if not exists seller_settlements_seller_id_status_idx
  on public.seller_settlements(seller_id, status);
