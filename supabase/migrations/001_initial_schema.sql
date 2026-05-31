-- Enable UUID extension
create extension if not exists "pgcrypto";

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  preferred_currency char(3) not null default 'USD',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ACCOUNTS
create type public.account_code_enum as enum ('main', 'bank_a', 'bank_b', 'bank_c');
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_code public.account_code_enum not null,
  name text not null,
  currency_code char(3) not null default 'USD',
  opening_balance numeric(15,2) not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, account_code)
);
create index if not exists idx_accounts_user_id on public.accounts(user_id);

-- CATEGORIES
create type public.category_type_enum as enum ('income', 'expense');
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type public.category_type_enum not null,
  color char(7) not null default '#64748B',
  icon text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_categories_user_id on public.categories(user_id);

-- TRANSACTIONS
create type public.transaction_type_enum as enum ('income', 'expense', 'transfer');
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  transfer_account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  txn_type public.transaction_type_enum not null,
  amount numeric(15,2) not null check (amount > 0),
  currency_code char(3) not null default 'USD',
  occurred_on date not null,
  description text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_account_id on public.transactions(account_id);
create index if not exists idx_transactions_category_id on public.transactions(category_id);
create index if not exists idx_transactions_occurred_on on public.transactions(occurred_on desc);
create index if not exists idx_transactions_txn_type on public.transactions(txn_type);

-- BUDGETS
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month_start date not null,
  amount numeric(15,2) not null check (amount > 0),
  currency_code char(3) not null default 'USD',
  alert_threshold_pct numeric(5,2) not null default 90 check (alert_threshold_pct between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, category_id, month_start)
);
create index if not exists idx_budgets_user_id on public.budgets(user_id);
create index if not exists idx_budgets_month_start on public.budgets(month_start);

-- EXCHANGE RATES
create table if not exists public.exchange_rates (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  base_currency char(3) not null,
  quote_currency char(3) not null,
  rate numeric(18,6) not null check (rate > 0),
  valid_on date not null,
  created_at timestamptz not null default now(),
  unique(user_id, base_currency, quote_currency, valid_on)
);
create index if not exists idx_exchange_rates_user_id on public.exchange_rates(user_id);

-- UPDATED_AT TRIGGER FUNCTION
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_accounts_updated_at before update on public.accounts for each row execute function public.set_updated_at();
create trigger trg_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger trg_transactions_updated_at before update on public.transactions for each row execute function public.set_updated_at();
create trigger trg_budgets_updated_at before update on public.budgets for each row execute function public.set_updated_at();

-- HANDLE NEW USER FUNCTION
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_full_name text;
begin
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.profiles (id, full_name)
  values (new.id, v_full_name)
  on conflict (id) do nothing;

  insert into public.accounts (user_id, account_code, name, currency_code)
  values
    (new.id, 'main',   'Main Wallet',  'USD'),
    (new.id, 'bank_a', 'Bank Account A','USD'),
    (new.id, 'bank_b', 'Bank Account B','USD'),
    (new.id, 'bank_c', 'Bank Account C','USD')
  on conflict (user_id, account_code) do nothing;

  insert into public.categories (user_id, name, type, color, is_system) values
    (new.id, 'Salary',        'income',  '#22C55E', true),
    (new.id, 'Freelance',     'income',  '#10B981', true),
    (new.id, 'Investment',    'income',  '#06B6D4', true),
    (new.id, 'Other Income',  'income',  '#84CC16', true),
    (new.id, 'Food & Dining', 'expense', '#F97316', true),
    (new.id, 'Transport',     'expense', '#3B82F6', true),
    (new.id, 'Housing',       'expense', '#8B5CF6', true),
    (new.id, 'Utilities',     'expense', '#EC4899', true),
    (new.id, 'Healthcare',    'expense', '#EF4444', true),
    (new.id, 'Entertainment', 'expense', '#F59E0B', true),
    (new.id, 'Shopping',      'expense', '#14B8A6', true),
    (new.id, 'Education',     'expense', '#6366F1', true),
    (new.id, 'Travel',        'expense', '#0EA5E9', true),
    (new.id, 'Subscriptions', 'expense', '#D946EF', true),
    (new.id, 'Other Expense', 'expense', '#64748B', true)
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.exchange_rates enable row level security;

-- PROFILES RLS
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- ACCOUNTS RLS
create policy "accounts_select_own" on public.accounts for select using (auth.uid() = user_id);
create policy "accounts_insert_own" on public.accounts for insert with check (auth.uid() = user_id);
create policy "accounts_update_own" on public.accounts for update using (auth.uid() = user_id);
create policy "accounts_delete_own" on public.accounts for delete using (auth.uid() = user_id);

-- CATEGORIES RLS
create policy "categories_select_own" on public.categories for select using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories for update using (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories for delete using (auth.uid() = user_id and is_system = false);

-- TRANSACTIONS RLS
create policy "transactions_select_own" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions for update using (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions for delete using (auth.uid() = user_id);

-- BUDGETS RLS
create policy "budgets_select_own" on public.budgets for select using (auth.uid() = user_id);
create policy "budgets_insert_own" on public.budgets for insert with check (auth.uid() = user_id);
create policy "budgets_update_own" on public.budgets for update using (auth.uid() = user_id);
create policy "budgets_delete_own" on public.budgets for delete using (auth.uid() = user_id);

-- EXCHANGE RATES RLS
create policy "exchange_rates_select_own" on public.exchange_rates for select using (auth.uid() = user_id);
create policy "exchange_rates_insert_own" on public.exchange_rates for insert with check (auth.uid() = user_id);
create policy "exchange_rates_update_own" on public.exchange_rates for update using (auth.uid() = user_id);
create policy "exchange_rates_delete_own" on public.exchange_rates for delete using (auth.uid() = user_id);
