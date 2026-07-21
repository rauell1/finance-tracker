-- 013_cookie_consent_logs.sql
-- Create table to track user cookie consent logs for GDPR & CCPA audit compliance.

CREATE TABLE IF NOT EXISTS public.cookie_consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  consent_id text,
  region text,
  consent_type text NOT NULL CHECK (consent_type IN ('all', 'none', 'custom')),
  categories_granted jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_agent text,
  ip_address_masked text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cookie_consent_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow inserts from anyone (public or authenticated)
DROP POLICY IF EXISTS "cookie_consent_logs_insert_all" ON public.cookie_consent_logs;
CREATE POLICY "cookie_consent_logs_insert_all" ON public.cookie_consent_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy to allow reads only for administrators
DROP POLICY IF EXISTS "cookie_consent_logs_select_admins" ON public.cookie_consent_logs;
CREATE POLICY "cookie_consent_logs_select_admins" ON public.cookie_consent_logs
  FOR SELECT
  TO authenticated
  USING (
    LOWER(auth.jwt() ->> 'email') = 'royokola3@gmail.com' OR 
    LOWER(auth.jwt() ->> 'email') = 'info@rauell.systems'
  );
