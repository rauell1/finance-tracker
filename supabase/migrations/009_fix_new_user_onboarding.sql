-- 1. Update profiles preferred_currency default to 'KES'
ALTER TABLE public.profiles 
  ALTER COLUMN preferred_currency SET DEFAULT 'KES';

-- 2. Re-create public.handle_new_user() with KES default accounts and all 6 accounts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_full_name text;
BEGIN
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  -- Insert profile with KES default
  INSERT INTO public.profiles (id, full_name, preferred_currency)
  VALUES (new.id, v_full_name, 'KES')
  ON CONFLICT (id) DO UPDATE 
  SET preferred_currency = EXCLUDED.preferred_currency;

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
