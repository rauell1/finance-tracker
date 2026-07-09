-- 1. Create a compound index for transaction list queries (which filter by user_id and order by occurred_on DESC, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_transactions_user_occurred_created 
  ON public.transactions (user_id, occurred_on DESC, created_at DESC);

-- 2. Create index on webhook_logs (ordered by created_at DESC for admin review dashboard)
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at 
  ON public.webhook_logs (created_at DESC);
