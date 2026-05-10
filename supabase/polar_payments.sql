-- Polar payment and ARA credit tables.
-- Apply after setting DATABASE_URL/DIRECT_URL to the Supabase PostgreSQL project.

create table if not exists public.payments (
  id text primary key,
  user_id text not null,
  user_email text,
  provider text not null default 'polar',
  provider_checkout_id text unique,
  provider_order_id text unique,
  product_type text not null,
  product_key text not null,
  status text not null default 'pending',
  amount_cents integer not null default 0,
  currency text not null default 'USD',
  credits integer not null default 0,
  metadata_json jsonb,
  provider_raw_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.user_credit_balances (
  user_id text primary key,
  balance integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id text primary key,
  user_id text not null,
  payment_id text references public.payments(id) on delete set null,
  type text not null,
  amount integer not null,
  balance_after integer not null,
  reason text not null,
  metadata_json jsonb,
  created_at timestamptz not null default now(),
  unique (payment_id, type)
);

create table if not exists public.seller_subscriptions (
  id text primary key,
  seller_id text not null,
  provider text not null default 'polar',
  provider_subscription_id text unique,
  plan_key text not null,
  status text not null default 'active',
  current_period_end timestamptz,
  metadata_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_user_id_created_at_idx
  on public.payments(user_id, created_at);

create index if not exists payments_status_created_at_idx
  on public.payments(status, created_at);

create index if not exists payments_provider_product_type_product_key_idx
  on public.payments(provider, product_type, product_key);

create index if not exists credit_ledger_user_id_created_at_idx
  on public.credit_ledger(user_id, created_at);

create index if not exists credit_ledger_type_created_at_idx
  on public.credit_ledger(type, created_at);

create index if not exists seller_subscriptions_seller_id_status_idx
  on public.seller_subscriptions(seller_id, status);
