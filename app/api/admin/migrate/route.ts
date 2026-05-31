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

  const connStr =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (!connStr) {
    return NextResponse.json({ error: "No Postgres connection string in env" }, { status: 500 });
  }

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

    const accts = await client2.query("select account_code, name from public.accounts order by account_code");
    await client2.end();

    return NextResponse.json({ status: "done", log, accounts: accts.rows });
  } catch (e) {
    try { await client.end(); } catch {}
    return NextResponse.json({ status: "error", log, error: (e as Error).message }, { status: 500 });
  }
}
