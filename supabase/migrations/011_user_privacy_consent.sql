-- 011_user_privacy_consent.sql
-- Add consent tracking to profiles and create an error logging table for admins.

-- 1. Add privacy and terms consent columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS accepted_privacy_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;

-- 2. Update public.handle_new_user() onboarding function to record initial registration consent
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_full_name text;
BEGIN
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  -- Insert profile with KES default and record terms/privacy consent timestamp
  INSERT INTO public.profiles (id, full_name, preferred_currency, accepted_privacy_at, accepted_terms_at)
  VALUES (new.id, v_full_name, 'KES', now(), now())
  ON CONFLICT (id) DO UPDATE 
  SET preferred_currency = EXCLUDED.preferred_currency,
      accepted_privacy_at = COALESCE(public.profiles.accepted_privacy_at, EXCLUDED.accepted_privacy_at),
      accepted_terms_at = COALESCE(public.profiles.accepted_terms_at, EXCLUDED.accepted_terms_at);

  -- Insert KES accounts with proper Kenyan bank/wallet names and codes
  INSERT INTO public.accounts (user_id, account_code, name, currency_code)
  VALUES
    (new.id, 'main',       'MPESA',        'KES'),
    (new.id, 'bank_a',     'DTB Bank',     'KES'),
    (new.id, 'bank_b',     'I&M Bank',     'KES'),
    (new.id, 'bank_c',     'SBM Bank',     'KES'),
    (new.id, 'kcb_mpesa',  'KCB M-PESA',   'KES'),
    (new.id, 'mshwari',    'M-Shwari',     'KES')
  ON CONFLICT (user_id, account_code) DO NOTHING;

  -- Insert default system categories
  INSERT INTO public.categories (user_id, name, type, color, is_system) VALUES
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
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$$;

-- 3. Create the error_logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  error_message text NOT NULL,
  stack_trace text,
  path text,
  context jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on error_logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- 4. Define security policies for error_logs
-- Only admins (royokola3@gmail.com & info@rauell.systems) can view error logs
DROP POLICY IF EXISTS "error_logs_select_admins" ON public.error_logs;
CREATE POLICY "error_logs_select_admins" ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (
    LOWER(auth.jwt() ->> 'email') = 'royokola3@gmail.com' OR 
    LOWER(auth.jwt() ->> 'email') = 'info@rauell.systems'
  );

-- Anyone (authenticated or anonymous) can insert error logs (e.g. client-side logging)
DROP POLICY IF EXISTS "error_logs_insert_all" ON public.error_logs;
CREATE POLICY "error_logs_insert_all" ON public.error_logs
  FOR INSERT
  WITH CHECK (true);
