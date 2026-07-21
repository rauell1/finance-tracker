-- 014_rbac_and_help_requests.sql
-- Implement Role-Based Access Control (RBAC) and Help & Suggestions portal.

-- 1. Alter profiles to add role column
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- 2. Define public.is_admin() security helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Seed existing admin roles based on email
-- Note: auth.users can be accessed securely within this migration context
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE LOWER(email) IN ('royokola3@gmail.com', 'info@rauell.systems')
);

-- 4. Update public.handle_new_user() onboarding function to assign role dynamically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_full_name text;
  v_role text;
BEGIN
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  
  -- Assign admin role if email matches administrators list
  IF LOWER(new.email) IN ('royokola3@gmail.com', 'info@rauell.systems') THEN
    v_role := 'admin';
  ELSE
    v_role := 'user';
  END IF;

  -- Insert profile with KES default and record terms/privacy consent timestamp & role
  INSERT INTO public.profiles (id, full_name, preferred_currency, accepted_privacy_at, accepted_terms_at, role)
  VALUES (new.id, v_full_name, 'KES', now(), now(), v_role)
  ON CONFLICT (id) DO UPDATE 
  SET preferred_currency = EXCLUDED.preferred_currency,
      accepted_privacy_at = COALESCE(public.profiles.accepted_privacy_at, EXCLUDED.accepted_privacy_at),
      accepted_terms_at = COALESCE(public.profiles.accepted_terms_at, EXCLUDED.accepted_terms_at),
      role = COALESCE(public.profiles.role, EXCLUDED.role);

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

-- 5. Update error_logs select policies to check public.is_admin()
DROP POLICY IF EXISTS "error_logs_select_admins" ON public.error_logs;
CREATE POLICY "error_logs_select_admins" ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 6. Update cookie_consent_logs select policies to check public.is_admin()
DROP POLICY IF EXISTS "cookie_consent_logs_select_admins" ON public.cookie_consent_logs;
CREATE POLICY "cookie_consent_logs_select_admins" ON public.cookie_consent_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 7. Create public.help_requests table
CREATE TABLE IF NOT EXISTS public.help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('bug', 'feature', 'question', 'improvement')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_response text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on help_requests
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

-- 8. Add security policies for help_requests
-- Users can insert help requests for themselves
DROP POLICY IF EXISTS "help_requests_insert_own" ON public.help_requests;
CREATE POLICY "help_requests_insert_own" ON public.help_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own help requests
DROP POLICY IF EXISTS "help_requests_select_own" ON public.help_requests;
CREATE POLICY "help_requests_select_own" ON public.help_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all help requests
DROP POLICY IF EXISTS "help_requests_select_all_admins" ON public.help_requests;
CREATE POLICY "help_requests_select_all_admins" ON public.help_requests
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update help requests (status, response)
DROP POLICY IF EXISTS "help_requests_update_admins" ON public.help_requests;
CREATE POLICY "help_requests_update_admins" ON public.help_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete help requests
DROP POLICY IF EXISTS "help_requests_delete_admins" ON public.help_requests;
CREATE POLICY "help_requests_delete_admins" ON public.help_requests
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
