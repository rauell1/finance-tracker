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
    const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
    const cols = await client.query(`SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('accounts','transactions','budgets','categories','profiles','recurring_obligations','debts') ORDER BY table_name, ordinal_position`);
    await client.end();
    return NextResponse.json({ tables: tables.rows, columns: cols.rows });
  } catch (e) {
    try { await client.end(); } catch {}
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const rawConn = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || "";
  const connStr = rawConn.replace(/[?&]sslmode=[^&]*/g, "");
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  const log: string[] = [];
  try {
    await client.connect();
    log.push("connected");

    // 1. Enable Realtime on new tables
    try {
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public.recurring_obligations`);
      log.push("realtime: recurring_obligations added");
    } catch (e) { log.push("realtime recurring: " + (e as Error).message); }

    try {
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public.debts`);
      log.push("realtime: debts added");
    } catch (e) { log.push("realtime debts: " + (e as Error).message); }

    // 2. Ensure indexes exist on new tables
    await client.query(`CREATE INDEX IF NOT EXISTS idx_recurring_user_active ON public.recurring_obligations(user_id) WHERE is_active = true`);
    log.push("idx_recurring_user_active ok");
    await client.query(`CREATE INDEX IF NOT EXISTS idx_debts_user_active ON public.debts(user_id) WHERE is_active = true`);
    log.push("idx_debts_user_active ok");
    await client.query(`CREATE INDEX IF NOT EXISTS idx_txns_occurred ON public.transactions(occurred_on DESC)`);
    log.push("idx_txns_occurred ok");
    await client.query(`CREATE INDEX IF NOT EXISTS idx_txns_account_type ON public.transactions(account_id, txn_type)`);
    log.push("idx_txns_account_type ok");

    // 3. Fix negative opening_balances on accounts that have no webhook-synced balance
    // SBM Bank (bank_c) and M-Shwari had no real SMS balance data — reset to 0
    const negFix = await client.query(`
      UPDATE public.accounts
      SET opening_balance = 0
      WHERE account_code IN ('bank_c', 'mshwari', 'bank_a', 'bank_b')
        AND opening_balance < 0
      RETURNING account_code, name, opening_balance
    `);
    log.push("negative balance fix: " + JSON.stringify(negFix.rows));

    // 4. Ensure categories table has the 'Savings' income category
    await client.query(`
      INSERT INTO public.categories (user_id, name, type, color, is_system)
      SELECT u.id, 'Savings', 'income', '#0EA5E9', true
      FROM auth.users u
      ON CONFLICT DO NOTHING
    `);
    log.push("Savings category ensured");

    // 5. Verify final account balances
    const accounts = await client.query(`SELECT account_code, name, opening_balance FROM public.accounts ORDER BY account_code`);
    const txnCount = await client.query(`SELECT COUNT(*) as cnt FROM public.transactions`);
    const recCount = await client.query(`SELECT COUNT(*) as cnt FROM public.recurring_obligations`);
    const debtCount = await client.query(`SELECT COUNT(*) as cnt FROM public.debts`);

    await client.end();
    return NextResponse.json({
      status: "done",
      log,
      accounts: accounts.rows,
      transaction_count: txnCount.rows[0].cnt,
      recurring_count: recCount.rows[0].cnt,
      debt_count: debtCount.rows[0].cnt,
    });
  } catch (e) {
    try { await client.end(); } catch {}
    return NextResponse.json({ status: "error", log, error: (e as Error).message }, { status: 500 });
  }
}
