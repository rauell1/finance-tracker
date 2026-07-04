-- 0. Clean up existing duplicates to allow index and constraint creation
-- Deduplicate transactions by mpesa_receipt
WITH dup_mpesa AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, (metadata->>'mpesa_receipt')
           ORDER BY occurred_on ASC, created_at ASC, id ASC
         ) as rn
  FROM public.transactions
  WHERE (metadata->>'mpesa_receipt') IS NOT NULL
)
DELETE FROM public.transactions
WHERE id IN (SELECT id FROM dup_mpesa WHERE rn > 1);

-- Deduplicate transactions by sbm_receipt
WITH dup_sbm AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, (metadata->>'sbm_receipt')
           ORDER BY occurred_on ASC, created_at ASC, id ASC
         ) as rn
  FROM public.transactions
  WHERE (metadata->>'sbm_receipt') IS NOT NULL
)
DELETE FROM public.transactions
WHERE id IN (SELECT id FROM dup_sbm WHERE rn > 1);

-- Deduplicate transactions by dtb_receipt
WITH dup_dtb AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, (metadata->>'dtb_receipt')
           ORDER BY occurred_on ASC, created_at ASC, id ASC
         ) as rn
  FROM public.transactions
  WHERE (metadata->>'dtb_receipt') IS NOT NULL
)
DELETE FROM public.transactions
WHERE id IN (SELECT id FROM dup_dtb WHERE rn > 1);

-- Deduplicate transactions by reference
WITH dup_ref AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, (metadata->>'reference')
           ORDER BY occurred_on ASC, created_at ASC, id ASC
         ) as rn
  FROM public.transactions
  WHERE (metadata->>'reference') IS NOT NULL
)
DELETE FROM public.transactions
WHERE id IN (SELECT id FROM dup_ref WHERE rn > 1);

-- Deduplicate debts by source_identifier
WITH dup_debts AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, source_identifier
           ORDER BY created_at ASC, id ASC
         ) as rn
  FROM public.debts
  WHERE source_identifier IS NOT NULL
)
DELETE FROM public.debts
WHERE id IN (SELECT id FROM dup_debts WHERE rn > 1);

-- 1. Deduplication Unique Indexes on Transactions
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_unique_mpesa_receipt 
  ON public.transactions (user_id, (metadata->>'mpesa_receipt')) 
  WHERE (metadata->>'mpesa_receipt' IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_unique_sbm_receipt 
  ON public.transactions (user_id, (metadata->>'sbm_receipt')) 
  WHERE (metadata->>'sbm_receipt' IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_unique_dtb_receipt 
  ON public.transactions (user_id, (metadata->>'dtb_receipt')) 
  WHERE (metadata->>'dtb_receipt' IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_unique_reference 
  ON public.transactions (user_id, (metadata->>'reference')) 
  WHERE (metadata->>'reference' IS NOT NULL);

-- 2. Unique Constraint on Debts for Auto-tracking
ALTER TABLE public.debts ADD CONSTRAINT unique_user_debt_source UNIQUE (user_id, source_identifier);

-- 3. Merchant Mappings Table
CREATE TABLE IF NOT EXISTS public.merchant_mappings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern text not null,
  category_id uuid not null references public.categories(id) on delete cascade,
  txn_type public.transaction_type_enum not null default 'expense',
  created_at timestamptz not null default now(),
  unique(user_id, pattern)
);

-- Enable Row Level Security on merchant_mappings
ALTER TABLE public.merchant_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY merchant_mappings_select_own ON public.merchant_mappings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY merchant_mappings_insert_own ON public.merchant_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY merchant_mappings_update_own ON public.merchant_mappings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY merchant_mappings_delete_own ON public.merchant_mappings
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Cached Account Balances & Sync Triggers
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS current_balance numeric(15,2) not null default 0;

-- Backfill existing balances
UPDATE public.accounts a
SET current_balance = a.opening_balance + COALESCE((
  SELECT SUM(
    CASE 
      WHEN t.txn_type = 'income' AND t.account_id = a.id THEN t.amount
      WHEN t.txn_type = 'expense' AND t.account_id = a.id THEN -t.amount
      WHEN t.txn_type = 'transfer' AND t.account_id = a.id THEN -t.amount
      WHEN t.txn_type = 'transfer' AND t.transfer_account_id = a.id THEN t.amount
      ELSE 0
    END
  )
  FROM public.transactions t
  WHERE (t.account_id = a.id OR t.transfer_account_id = a.id)
    AND COALESCE((t.metadata->>'is_transfer_counter')::boolean, false) = false
), 0);

-- Trigger function for synchronizing balances on transaction mutations
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
declare
  v_is_counter boolean;
  v_old_is_counter boolean;
begin
  -- For INSERT
  if (TG_OP = 'INSERT') then
    v_is_counter := COALESCE((new.metadata->>'is_transfer_counter')::boolean, false);
    if v_is_counter then
      return new;
    end if;

    if (new.txn_type = 'income') then
      update public.accounts set current_balance = current_balance + new.amount where id = new.account_id;
    elsif (new.txn_type = 'expense') then
      update public.accounts set current_balance = current_balance - new.amount where id = new.account_id;
    elsif (new.txn_type = 'transfer') then
      update public.accounts set current_balance = current_balance - new.amount where id = new.account_id;
      if (new.transfer_account_id is not null) then
        update public.accounts set current_balance = current_balance + new.amount where id = new.transfer_account_id;
      end if;
    end if;
    return new;
  end if;

  -- For DELETE
  if (TG_OP = 'DELETE') then
    v_old_is_counter := COALESCE((old.metadata->>'is_transfer_counter')::boolean, false);
    if v_old_is_counter then
      return old;
    end if;

    if (old.txn_type = 'income') then
      update public.accounts set current_balance = current_balance - old.amount where id = old.account_id;
    elsif (old.txn_type = 'expense') then
      update public.accounts set current_balance = current_balance + old.amount where id = old.account_id;
    elsif (old.txn_type = 'transfer') then
      update public.accounts set current_balance = current_balance + old.amount where id = old.account_id;
      if (old.transfer_account_id is not null) then
        update public.accounts set current_balance = current_balance - old.amount where id = old.transfer_account_id;
      end if;
    end if;
    return old;
  end if;

  -- For UPDATE
  if (TG_OP = 'UPDATE') then
    -- Deduct old values (if not a counter transaction)
    v_old_is_counter := COALESCE((old.metadata->>'is_transfer_counter')::boolean, false);
    if not v_old_is_counter then
      if (old.txn_type = 'income') then
        update public.accounts set current_balance = current_balance - old.amount where id = old.account_id;
      elsif (old.txn_type = 'expense') then
        update public.accounts set current_balance = current_balance + old.amount where id = old.account_id;
      elsif (old.txn_type = 'transfer') then
        update public.accounts set current_balance = current_balance + old.amount where id = old.account_id;
        if (old.transfer_account_id is not null) then
          update public.accounts set current_balance = current_balance - old.amount where id = old.transfer_account_id;
        end if;
      end if;
    end if;

    -- Add new values (if not a counter transaction)
    v_is_counter := COALESCE((new.metadata->>'is_transfer_counter')::boolean, false);
    if not v_is_counter then
      if (new.txn_type = 'income') then
        update public.accounts set current_balance = current_balance + new.amount where id = new.account_id;
      elsif (new.txn_type = 'expense') then
        update public.accounts set current_balance = current_balance - new.amount where id = new.account_id;
      elsif (new.txn_type = 'transfer') then
        update public.accounts set current_balance = current_balance - new.amount where id = new.account_id;
        if (new.transfer_account_id is not null) then
          update public.accounts set current_balance = current_balance + new.amount where id = new.transfer_account_id;
        end if;
      end if;
    end if;

    return new;
  end if;

  return null;
end;
$$;

-- Create sync trigger for transactions
DROP TRIGGER IF EXISTS trg_transactions_balance_sync ON public.transactions;
CREATE TRIGGER trg_transactions_balance_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- Trigger function for synchronizing balances when opening_balance is adjusted
CREATE OR REPLACE FUNCTION public.update_account_opening_balance_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
begin
  if (old.opening_balance IS DISTINCT FROM new.opening_balance) then
    new.current_balance := new.current_balance + (new.opening_balance - old.opening_balance);
  end if;
  return new;
end;
$$;

-- Create sync trigger for accounts
DROP TRIGGER IF EXISTS trg_accounts_opening_balance_sync ON public.accounts;
CREATE TRIGGER trg_accounts_opening_balance_sync
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_account_opening_balance_sync();
