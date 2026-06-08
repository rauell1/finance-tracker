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

    await client.end();
    return NextResponse.json({
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
