import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

const DDL = `
-- 1a. Extend budgets to support income budgets
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS txn_type text NOT NULL DEFAULT 'expense'
  CHECK (txn_type IN ('income','expense'));

-- 1b. Recurring obligations (bills + subscriptions unified)
CREATE TABLE IF NOT EXISTS public.recurring_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  obligation_type text NOT NULL CHECK (obligation_type IN ('bill','subscription')),
  name text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount numeric(15,2) NOT NULL CHECK (amount > 0),
  currency_code char(3) NOT NULL DEFAULT 'KES',
  recurrence text NOT NULL DEFAULT 'monthly' CHECK (recurrence IN ('weekly','monthly','quarterly','yearly')),
  due_day_of_month int CHECK (due_day_of_month BETWEEN 1 AND 31),
  next_due_date date,
  match_keywords text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  last_paid_date date,
  last_transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recurring_user ON public.recurring_obligations(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next_due ON public.recurring_obligations(next_due_date) WHERE is_active = true;

ALTER TABLE public.recurring_obligations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recurring_select_own" ON public.recurring_obligations;
CREATE POLICY "recurring_select_own" ON public.recurring_obligations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "recurring_insert_own" ON public.recurring_obligations;
CREATE POLICY "recurring_insert_own" ON public.recurring_obligations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "recurring_update_own" ON public.recurring_obligations;
CREATE POLICY "recurring_update_own" ON public.recurring_obligations FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "recurring_delete_own" ON public.recurring_obligations;
CREATE POLICY "recurring_delete_own" ON public.recurring_obligations FOR DELETE USING (auth.uid() = user_id);

-- 1c. Debts tracker
CREATE TABLE IF NOT EXISTS public.debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creditor text NOT NULL,
  debt_type text NOT NULL DEFAULT 'loan' CHECK (debt_type IN ('loan','overdraft','credit_card','fuliza','mshwari_loan','kcb_overdraft','other')),
  principal numeric(15,2) NOT NULL DEFAULT 0,
  current_balance numeric(15,2) NOT NULL DEFAULT 0,
  interest_rate numeric(5,2),
  monthly_payment numeric(15,2),
  due_date date,
  currency_code char(3) NOT NULL DEFAULT 'KES',
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  auto_tracked boolean NOT NULL DEFAULT false,
  source_identifier text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_debts_user ON public.debts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_debts_user_source ON public.debts(user_id, source_identifier) WHERE source_identifier IS NOT NULL;

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "debts_select_own" ON public.debts;
CREATE POLICY "debts_select_own" ON public.debts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "debts_insert_own" ON public.debts;
CREATE POLICY "debts_insert_own" ON public.debts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "debts_update_own" ON public.debts;
CREATE POLICY "debts_update_own" ON public.debts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "debts_delete_own" ON public.debts;
CREATE POLICY "debts_delete_own" ON public.debts FOR DELETE USING (auth.uid() = user_id);

DO $mig$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_recurring_updated_at') THEN
    CREATE TRIGGER trg_recurring_updated_at BEFORE UPDATE ON public.recurring_obligations
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_debts_updated_at') THEN
    CREATE TRIGGER trg_debts_updated_at BEFORE UPDATE ON public.debts
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $mig$;
`;

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  let conn = process.env.POSTGRES_URL_NON_POOLING ?? "";
  if (!conn) {
    return NextResponse.json({ error: "POSTGRES_URL_NON_POOLING not set" }, { status: 500 });
  }
  // Strip sslmode params
  conn = conn.replace(/[?&]sslmode=[^&]+/g, "");
  conn = conn.replace(/[?&]supa=[^&]+/g, "");

  const client = new Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(DDL);

    // Verify tables exist
    const verify = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_name IN ('recurring_obligations','debts','budgets')
      ORDER BY table_name;
    `);
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name='budgets' AND column_name='txn_type';
    `);
    await client.end();

    return NextResponse.json({
      status: "ok",
      tables: verify.rows.map((r) => r.table_name),
      budgets_txn_type: cols.rows.length > 0,
    });
  } catch (err) {
    try { await client.end(); } catch {}
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
