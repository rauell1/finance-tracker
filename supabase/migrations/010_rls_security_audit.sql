-- 010_rls_security_audit.sql
-- Enforce Row Level Security (RLS) on all public schema tables and verify policies.

-- 1. Ensure RLS is active on all tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recurring_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.merchant_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- 2. Audit/verify PROFILES policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 3. Audit/verify ACCOUNTS policies
DROP POLICY IF EXISTS "accounts_select_own" ON public.accounts;
CREATE POLICY "accounts_select_own" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "accounts_insert_own" ON public.accounts;
CREATE POLICY "accounts_insert_own" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "accounts_update_own" ON public.accounts;
CREATE POLICY "accounts_update_own" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "accounts_delete_own" ON public.accounts;
CREATE POLICY "accounts_delete_own" ON public.accounts
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Audit/verify CATEGORIES policies
DROP POLICY IF EXISTS "categories_select_own" ON public.categories;
CREATE POLICY "categories_select_own" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_insert_own" ON public.categories;
CREATE POLICY "categories_insert_own" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_update_own" ON public.categories;
CREATE POLICY "categories_update_own" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_delete_own" ON public.categories;
CREATE POLICY "categories_delete_own" ON public.categories
  FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- 5. Audit/verify TRANSACTIONS policies
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
CREATE POLICY "transactions_insert_own" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
CREATE POLICY "transactions_update_own" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;
CREATE POLICY "transactions_delete_own" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Audit/verify BUDGETS policies
DROP POLICY IF EXISTS "budgets_select_own" ON public.budgets;
CREATE POLICY "budgets_select_own" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_insert_own" ON public.budgets;
CREATE POLICY "budgets_insert_own" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_update_own" ON public.budgets;
CREATE POLICY "budgets_update_own" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_delete_own" ON public.budgets;
CREATE POLICY "budgets_delete_own" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Audit/verify EXCHANGE_RATES policies
DROP POLICY IF EXISTS "exchange_rates_select_own" ON public.exchange_rates;
CREATE POLICY "exchange_rates_select_own" ON public.exchange_rates
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "exchange_rates_insert_own" ON public.exchange_rates;
CREATE POLICY "exchange_rates_insert_own" ON public.exchange_rates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "exchange_rates_update_own" ON public.exchange_rates;
CREATE POLICY "exchange_rates_update_own" ON public.exchange_rates
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "exchange_rates_delete_own" ON public.exchange_rates;
CREATE POLICY "exchange_rates_delete_own" ON public.exchange_rates
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Audit/verify DEBTS policies
DROP POLICY IF EXISTS "debts_select_own" ON public.debts;
CREATE POLICY "debts_select_own" ON public.debts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "debts_insert_own" ON public.debts;
CREATE POLICY "debts_insert_own" ON public.debts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "debts_update_own" ON public.debts;
CREATE POLICY "debts_update_own" ON public.debts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "debts_delete_own" ON public.debts;
CREATE POLICY "debts_delete_own" ON public.debts
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Audit/verify RECURRING_OBLIGATIONS policies
DROP POLICY IF EXISTS "recurring_obligations_select_own" ON public.recurring_obligations;
CREATE POLICY "recurring_obligations_select_own" ON public.recurring_obligations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "recurring_obligations_insert_own" ON public.recurring_obligations;
CREATE POLICY "recurring_obligations_insert_own" ON public.recurring_obligations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "recurring_obligations_update_own" ON public.recurring_obligations;
CREATE POLICY "recurring_obligations_update_own" ON public.recurring_obligations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "recurring_obligations_delete_own" ON public.recurring_obligations;
CREATE POLICY "recurring_obligations_delete_own" ON public.recurring_obligations
  FOR DELETE USING (auth.uid() = user_id);

-- 10. Audit/verify SAVINGS_GOALS policies
DROP POLICY IF EXISTS "savings_goals_select_own" ON public.savings_goals;
CREATE POLICY "savings_goals_select_own" ON public.savings_goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_goals_insert_own" ON public.savings_goals;
CREATE POLICY "savings_goals_insert_own" ON public.savings_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_goals_update_own" ON public.savings_goals;
CREATE POLICY "savings_goals_update_own" ON public.savings_goals
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_goals_delete_own" ON public.savings_goals;
CREATE POLICY "savings_goals_delete_own" ON public.savings_goals
  FOR DELETE USING (auth.uid() = user_id);

-- 11. Audit/verify MERCHANT_MAPPINGS policies
DROP POLICY IF EXISTS "merchant_mappings_select_own" ON public.merchant_mappings;
CREATE POLICY "merchant_mappings_select_own" ON public.merchant_mappings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "merchant_mappings_insert_own" ON public.merchant_mappings;
CREATE POLICY "merchant_mappings_insert_own" ON public.merchant_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "merchant_mappings_update_own" ON public.merchant_mappings;
CREATE POLICY "merchant_mappings_update_own" ON public.merchant_mappings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "merchant_mappings_delete_own" ON public.merchant_mappings;
CREATE POLICY "merchant_mappings_delete_own" ON public.merchant_mappings
  FOR DELETE USING (auth.uid() = user_id);

-- 12. Audit/verify WEBHOOK_LOGS policies
DROP POLICY IF EXISTS "webhook_logs_select_own" ON public.webhook_logs;
CREATE POLICY "webhook_logs_select_own" ON public.webhook_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "webhook_logs_delete_own" ON public.webhook_logs;
CREATE POLICY "webhook_logs_delete_own" ON public.webhook_logs
  FOR DELETE USING (auth.uid() = user_id);
