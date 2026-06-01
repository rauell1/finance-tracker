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
    // List all tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    // List columns for finance tables
    const cols = await client.query(`
      SELECT table_name, column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('accounts','transactions','budgets','categories','profiles','recurring_obligations','debts')
      ORDER BY table_name, ordinal_position
    `);
    await client.end();
    return NextResponse.json({ tables: tables.rows, columns: cols.rows });
  } catch (e) {
    try { await client.end(); } catch {}
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
