import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const rawConn = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || "";
  const connStr = rawConn.replace(/[?&]sslmode=[^&]*/g, "");
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();

    // ===== ENSURE MIGRATION 007 IS APPLIED =====
    // Check if webhook_token column exists on profiles
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'webhook_token'
    `);

    const migrationResults: string[] = [];

    if (colCheck.rows.length === 0) {
      // Column doesn't exist - run the migration
      await client.query(`
        ALTER TABLE public.profiles 
          ADD COLUMN IF NOT EXISTS webhook_token uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_profiles_webhook_token 
          ON public.profiles (webhook_token)
      `);
      migrationResults.push("Added webhook_token column to profiles");
    } else {
      migrationResults.push("webhook_token column already exists");
    }

    // Check if user_id column exists on webhook_logs
    const userIdCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'webhook_logs' AND column_name = 'user_id'
    `);

    if (userIdCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE public.webhook_logs 
          ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON public.webhook_logs (user_id)
      `);
      migrationResults.push("Added user_id column to webhook_logs");
    } else {
      migrationResults.push("user_id column on webhook_logs already exists");
    }

    // Ensure RLS is enabled on webhook_logs
    await client.query(`ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY`);

    // Ensure RLS policies exist
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_logs' AND policyname = 'webhook_logs_select_own') THEN
          CREATE POLICY "webhook_logs_select_own" ON public.webhook_logs FOR SELECT USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_logs' AND policyname = 'webhook_logs_delete_own') THEN
          CREATE POLICY "webhook_logs_delete_own" ON public.webhook_logs FOR DELETE USING (auth.uid() = user_id);
        END IF;
      END $$;
    `);
    migrationResults.push("RLS enabled and policies verified on webhook_logs");

    // Backfill any webhook_logs with NULL user_id
    const backfill = await client.query(`
      UPDATE public.webhook_logs 
      SET user_id = (SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1) 
      WHERE user_id IS NULL
    `);
    migrationResults.push(`Backfilled ${backfill.rowCount} webhook_logs rows`);

    // ===== ENSURE MIGRATION 009 IS APPLIED (Onboarding fix) =====
    const prefCurrencyCheck = await client.query(`
      SELECT column_default FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'preferred_currency'
    `);
    
    const prefDefault = prefCurrencyCheck.rows[0]?.column_default || "";
    if (!prefDefault.includes("KES")) {
      await client.query(`
        ALTER TABLE public.profiles 
          ALTER COLUMN preferred_currency SET DEFAULT 'KES'
      `);
      
      await client.query(`
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
      `);
      migrationResults.push("Applied migration 009: fixed new user onboarding triggers (KES default accounts & preferred currency)");
    } else {
      migrationResults.push("Migration 009 already applied");
    }

    // ===== ENSURE MIGRATION 011 IS APPLIED (Privacy consent & error logs) =====
    const consentCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'accepted_privacy_at'
    `);

    if (consentCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE public.profiles 
          ADD COLUMN IF NOT EXISTS accepted_privacy_at timestamptz,
          ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz
      `);

      await client.query(`
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
      `);

      migrationResults.push("Added accepted_privacy_at and accepted_terms_at columns to profiles and updated trigger function");
    } else {
      migrationResults.push("Privacy and terms consent columns already exist on profiles");
    }

    // Ensure error_logs table exists
    const errorLogsCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'error_logs'
    `);

    if (errorLogsCheck.rows.length === 0) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.error_logs (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
          user_email text,
          error_message text NOT NULL,
          stack_trace text,
          path text,
          context jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `);
      await client.query(`ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY`);
      await client.query(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'error_logs' AND policyname = 'error_logs_select_admins') THEN
            CREATE POLICY "error_logs_select_admins" ON public.error_logs
              FOR SELECT TO authenticated
              USING (
                LOWER(auth.jwt() ->> 'email') = 'royokola3@gmail.com' OR 
                LOWER(auth.jwt() ->> 'email') = 'info@rauell.systems'
              );
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'error_logs' AND policyname = 'error_logs_insert_all') THEN
            CREATE POLICY "error_logs_insert_all" ON public.error_logs
              FOR INSERT WITH CHECK (true);
          END IF;
        END $$;
      `);
      migrationResults.push("Created error_logs table and configured admin RLS policies");
    } else {
      migrationResults.push("error_logs table already exists");
    }

    // Diagnostic: fetch profiles columns
    const profileCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles' 
      ORDER BY ordinal_position
    `);

    // 1. All public tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);

    // 2. Row counts for key tables
    const counts = await client.query(`
      SELECT 'accounts' as tbl, count(*) as cnt FROM public.accounts
      UNION ALL SELECT 'transactions', count(*) FROM public.transactions
      UNION ALL SELECT 'categories', count(*) FROM public.categories
      UNION ALL SELECT 'budgets', count(*) FROM public.budgets
      UNION ALL SELECT 'recurring_obligations', count(*) FROM public.recurring_obligations
      UNION ALL SELECT 'debts', count(*) FROM public.debts
      UNION ALL SELECT 'savings_goals', count(*) FROM public.savings_goals
      UNION ALL SELECT 'category_mappings', count(*) FROM public.category_mappings
      UNION ALL SELECT 'profiles', count(*) FROM public.profiles
      UNION ALL SELECT 'exchange_rates', count(*) FROM public.exchange_rates
      UNION ALL SELECT 'error_logs', count(*) FROM public.error_logs
    `);

    // 3. RLS status
    const rls = await client.query(`
      SELECT tablename, rowsecurity FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    // 4. Check realtime publication
    const realtime = await client.query(`
      SELECT schemaname, tablename FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
      ORDER BY tablename
    `);

    // 5. Indexes on key tables
    const indexes = await client.query(`
      SELECT tablename, indexname FROM pg_indexes
      WHERE schemaname = 'public' AND tablename IN (
        'transactions','accounts','budgets','recurring_obligations','debts','savings_goals','category_mappings','categories'
      ) ORDER BY tablename, indexname
    `);

    // 6. Account balances (audit)
    const balances = await client.query(`SELECT account_code, name, opening_balance FROM public.accounts ORDER BY account_code`);

    // 7. Recent webhook logs (audit)
    const recentLogs = await client.query(`
      SELECT id, created_at, reason, raw_body, sms_text, content_type, user_id 
      FROM public.webhook_logs 
      ORDER BY created_at DESC 
      LIMIT 15
    `);

    // 8. Search for recent transactions overall
    const recentTxns = await client.query(`
      SELECT id, description, amount, occurred_on, txn_type, account_id, category_id, metadata
      FROM public.transactions 
      ORDER BY created_at DESC
      LIMIT 15
    `);

    await client.end();
    return NextResponse.json({
      migration_007: migrationResults,
      profiles_columns: profileCols.rows,
      recent_webhook_logs: recentLogs.rows,
      recent_transactions: recentTxns.rows,
      tables: tables.rows.map((r: any) => r.table_name),
      row_counts: counts.rows,
      rls_status: rls.rows,
      realtime_tables: realtime.rows.map((r: any) => r.tablename),
      index_count: indexes.rows.length,
      indexes: indexes.rows,
      balances: balances.rows,
    });
  } catch (e) {
    try { await client.end(); } catch {}
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
