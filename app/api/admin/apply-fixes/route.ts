import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

// One-off maintenance endpoint: creates webhook_logs and records the missed
// 2026-06-25 KCB->MPESA transfer with balance-neutral opening adjustments.
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report: Record<string, any> = {};

  // Step 1: create webhook_logs via direct Postgres (DDL)
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const rawConn = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || "";
  const connStr = rawConn.replace(/[?&]sslmode=[^&]*/g, "");
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.webhook_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        raw_body text,
        content_type text,
        sms_text text,
        reason text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        replayed_at timestamptz,
        replay_result jsonb
      );
    `);
    await client.query(`ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;`);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_logs' AND policyname = 'authenticated_read_webhook_logs') THEN
          CREATE POLICY "authenticated_read_webhook_logs" ON public.webhook_logs FOR SELECT TO authenticated USING (true);
        END IF;
      END $$;
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs (created_at DESC);`);
    await client.query(`GRANT ALL ON public.webhook_logs TO service_role, authenticated;`);
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    report.webhook_logs_table = "created_or_exists";
    await client.end();
  } catch (e) {
    try { await client.end(); } catch {}
    report.webhook_logs_table = `failed: ${(e as Error).message}`;
  }

  // Step 2: record the missed KCB->MPESA 2000 transfer, balance-neutral
  const supabase = createAdminClient();
  const { data: accounts } = await supabase.from("accounts").select("id, user_id, account_code, opening_balance");
  const kcb = (accounts ?? []).find((a: any) => a.account_code === "kcb_mpesa");
  const main = (accounts ?? []).find((a: any) => a.account_code === "main");
  if (!kcb || !main) {
    report.transfer = "failed: accounts not found";
    return NextResponse.json(report, { status: 500 });
  }

  const { data: existing } = await supabase
    .from("transactions")
    .select("id")
    .eq("txn_type", "transfer")
    .eq("amount", 2000)
    .eq("account_id", kcb.id)
    .eq("transfer_account_id", main.id)
    .eq("occurred_on", "2026-06-25");

  if (existing && existing.length > 0) {
    report.transfer = { status: "already_recorded", id: existing[0].id };
  } else {
    const { data: txn, error: insErr } = await supabase.from("transactions").insert({
      user_id: kcb.user_id,
      account_id: kcb.id,
      transfer_account_id: main.id,
      category_id: null,
      txn_type: "transfer",
      amount: 2000,
      currency_code: "KES",
      occurred_on: "2026-06-25",
      description: "KCB M-PESA withdrawal to MPESA wallet",
      metadata: { source: "manual_entry", note: "Backfilled missed transfer; openings adjusted to keep balances unchanged" },
    }).select("id").single();
    if (insErr) {
      report.transfer = `failed: ${insErr.message}`;
      return NextResponse.json(report, { status: 500 });
    }

    // Balance-neutral compensation: transfer moves computed KCB -2000 and MPESA +2000,
    // but both balances were already correct (setBalance calibrations absorbed the
    // missing transfer), so shift openings to cancel the effect.
    const { error: e1 } = await supabase.from("accounts")
      .update({ opening_balance: Number(kcb.opening_balance) + 2000 }).eq("id", kcb.id);
    const { error: e2 } = await supabase.from("accounts")
      .update({ opening_balance: Number(main.opening_balance) - 2000 }).eq("id", main.id);
    report.transfer = {
      status: "recorded",
      id: txn.id,
      kcb_opening: e1 ? `failed: ${e1.message}` : `${kcb.opening_balance} -> ${Number(kcb.opening_balance) + 2000}`,
      main_opening: e2 ? `failed: ${e2.message}` : `${main.opening_balance} -> ${Number(main.opening_balance) - 2000}`,
    };
  }

  return NextResponse.json(report);
}
