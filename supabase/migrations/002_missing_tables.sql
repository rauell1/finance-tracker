-- DEBTS
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  creditor text not null,
  debt_type text not null default 'loan'
    check (debt_type in ('loan','overdraft','credit_card','fuliza','mshwari_loan','kcb_overdraft','other')),
  principal numeric(15,2) not null default 0,
  current_balance numeric(15,2) not null default 0,
  interest_rate numeric(5,2),
  monthly_payment numeric(15,2),
  due_date date,
  currency_code char(3) not null default 'KES',
  notes text,
  is_active boolean not null default true,
  auto_tracked boolean not null default false,
  source_identifier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_debts_user_id on public.debts(user_id);
create index if not exists idx_debts_source_identifier on public.debts(source_identifier) where source_identifier is not null;

create trigger trg_debts_updated_at before update on public.debts
  for each row execute function public.set_updated_at();

alter table public.debts enable row level security;
create policy "debts_select_own" on public.debts for select using (auth.uid() = user_id);
create policy "debts_insert_own" on public.debts for insert with check (auth.uid() = user_id);
create policy "debts_update_own" on public.debts for update using (auth.uid() = user_id);
create policy "debts_delete_own" on public.debts for delete using (auth.uid() = user_id);

-- RECURRING OBLIGATIONS
create table if not exists public.recurring_obligations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  obligation_type text not null default 'bill'
    check (obligation_type in ('bill','subscription')),
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  amount numeric(15,2) not null check (amount > 0),
  currency_code char(3) not null default 'KES',
  recurrence text not null default 'monthly'
    check (recurrence in ('weekly','monthly','quarterly','yearly')),
  due_day_of_month int check (due_day_of_month between 1 and 31),
  next_due_date date,
  match_keywords text,
  notes text,
  is_active boolean not null default true,
  last_paid_date date,
  last_transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_recurring_obligations_user_id on public.recurring_obligations(user_id);

create trigger trg_recurring_obligations_updated_at before update on public.recurring_obligations
  for each row execute function public.set_updated_at();

alter table public.recurring_obligations enable row level security;
create policy "recurring_obligations_select_own" on public.recurring_obligations for select using (auth.uid() = user_id);
create policy "recurring_obligations_insert_own" on public.recurring_obligations for insert with check (auth.uid() = user_id);
create policy "recurring_obligations_update_own" on public.recurring_obligations for update using (auth.uid() = user_id);
create policy "recurring_obligations_delete_own" on public.recurring_obligations for delete using (auth.uid() = user_id);

-- SAVINGS GOALS
create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(15,2) not null check (target_amount > 0),
  current_amount numeric(15,2) not null default 0,
  target_date date,
  account_id uuid references public.accounts(id) on delete set null,
  is_completed boolean not null default false,
  currency_code char(3) not null default 'KES',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_savings_goals_user_id on public.savings_goals(user_id);

create trigger trg_savings_goals_updated_at before update on public.savings_goals
  for each row execute function public.set_updated_at();

alter table public.savings_goals enable row level security;
create policy "savings_goals_select_own" on public.savings_goals for select using (auth.uid() = user_id);
create policy "savings_goals_insert_own" on public.savings_goals for insert with check (auth.uid() = user_id);
create policy "savings_goals_update_own" on public.savings_goals for update using (auth.uid() = user_id);
create policy "savings_goals_delete_own" on public.savings_goals for delete using (auth.uid() = user_id);
