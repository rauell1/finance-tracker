import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

// ONE-TIME: run DDL on the live project via direct Postgres connection.
// DELETE THIS FILE after running.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Supabase direct host presents a cert chain Node flags as self-signed — disable for this one-time call
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const rawConn =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (!rawConn) {
    return NextResponse.json({ error: "No Postgres connection string in env" }, { status: 500 });
  }
  // Strip sslmode so our explicit ssl config wins
  const connStr = rawConn.replace(/[?&]sslmode=[^&]*/g, "");

  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  const log: string[] = [];

  try {
    await client.connect();
    log.push("connected");

    // Which project / db are we on?
    const who = await client.query("select current_database() as db, inet_server_addr() as host");
    log.push(`db=${who.rows[0]?.db} host=${who.rows[0]?.host}`);

    // 1. Add enum values (each must be its own statement, cannot be in a txn block with use)
    try { await client.query("ALTER TYPE public.account_code_enum ADD VALUE IF NOT EXISTS 'kcb_mpesa'"); log.push("enum kcb_mpesa ok"); }
    catch (e) { log.push("enum kcb_mpesa: " + (e as Error).message); }
    try { await client.query("ALTER TYPE public.account_code_enum ADD VALUE IF NOT EXISTS 'mshwari'"); log.push("enum mshwari ok"); }
    catch (e) { log.push("enum mshwari: " + (e as Error).message); }

    // 2. Seed sub-wallet accounts for all users (enum value must be committed first → new connection)
    await client.end();
    const client2 = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
    await client2.connect();

    const seed = await client2.query(`
      INSERT INTO public.accounts (user_id, account_code, name, currency_code, opening_balance)
      SELECT u.id, v.code::public.account_code_enum, v.nm, 'KES', 0
      FROM auth.users u
      CROSS JOIN (VALUES ('kcb_mpesa','KCB M-PESA'), ('mshwari','M-Shwari')) AS v(code, nm)
      ON CONFLICT (user_id, account_code) DO NOTHING
    `);
    log.push(`accounts seeded: ${seed.rowCount}`);

    // Clean all test transactions (fresh slate for real data)
    const del = await client2.query("DELETE FROM public.transactions");
    log.push(`test transactions deleted: ${del.rowCount}`);

    // Reset all balances to 0
    await client2.query("UPDATE public.accounts SET opening_balance = 0");
    log.push("balances reset to 0");

    // Update handle_new_user: KES + 6 accounts with correct names
    await client2.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
      DECLARE v_full_name text;
      BEGIN
        v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
        INSERT INTO public.profiles (id, full_name, preferred_currency)
        VALUES (new.id, v_full_name, 'KES') ON CONFLICT (id) DO NOTHING;
        INSERT INTO public.accounts (user_id, account_code, name, currency_code) VALUES
          (new.id, 'main','MPESA','KES'), (new.id, 'kcb_mpesa','KCB M-PESA','KES'),
          (new.id, 'mshwari','M-Shwari','KES'), (new.id, 'bank_a','DTB Bank','KES'),
          (new.id, 'bank_b','I&M Bank','KES'), (new.id, 'bank_c','SBM Bank','KES')
        ON CONFLICT (user_id, account_code) DO NOTHING;
        INSERT INTO public.categories (user_id, name, type, color, is_system) VALUES
          (new.id,'Salary','income','#22C55E',true),(new.id,'Freelance','income','#10B981',true),
          (new.id,'Investment','income','#06B6D4',true),(new.id,'Other Income','income','#84CC16',true),
          (new.id,'Food & Dining','expense','#F97316',true),(new.id,'Transport','expense','#3B82F6',true),
          (new.id,'Housing','expense','#8B5CF6',true),(new.id,'Utilities','expense','#EC4899',true),
          (new.id,'Healthcare','expense','#EF4444',true),(new.id,'Entertainment','expense','#F59E0B',true),
          (new.id,'Shopping','expense','#14B8A6',true),(new.id,'Education','expense','#6366F1',true),
          (new.id,'Travel','expense','#0EA5E9',true),(new.id,'Subscriptions','expense','#D946EF',true),
          (new.id,'Other Expense','expense','#64748B',true)
        ON CONFLICT DO NOTHING;
        RETURN new;
      END; $fn$;
    `);
    log.push("handle_new_user updated");

    const accts = await client2.query("select account_code, name, opening_balance from public.accounts order by account_code");
    await client2.end();

    return NextResponse.json({ status: "done", log, accounts: accts.rows });
  } catch (e) {
    try { await client.end(); } catch {}
    return NextResponse.json({ status: "error", log, error: (e as Error).message }, { status: 500 });
  }
}
