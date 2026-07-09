-- 1. Add webhook_token to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS webhook_token uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE;

-- Create index on profiles(webhook_token) for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_webhook_token 
  ON public.profiles (webhook_token);

-- 2. Add user_id to webhook_logs (allow NULL in case of unresolvable/unauthorized webhooks)
ALTER TABLE public.webhook_logs 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on webhook_logs(user_id) for fast filtering
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id 
  ON public.webhook_logs (user_id);

-- 3. Enable RLS on webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for select/delete
DROP POLICY IF EXISTS "webhook_logs_select_own" ON public.webhook_logs;
CREATE POLICY "webhook_logs_select_own" 
  ON public.webhook_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "webhook_logs_delete_own" ON public.webhook_logs;
CREATE POLICY "webhook_logs_delete_own" 
  ON public.webhook_logs 
  FOR DELETE 
  USING (auth.uid() = user_id);
