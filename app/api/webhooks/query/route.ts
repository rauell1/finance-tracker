import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    // 1. Fetch accounts
    const { data: accounts, error: acctErr } = await supabase
      .from("accounts")
      .select("id, name, account_code, opening_balance, user_id");
    
    if (acctErr) throw acctErr;

    // 2. Fetch transactions for user 4a49b47d-7020-4752-9daa-616da026d3f7 around the dates
    const { data: txns, error: txnErr } = await supabase
      .from("transactions")
      .select("id, account_id, category_id, txn_type, amount, occurred_on, description, metadata, created_at")
      .eq("user_id", "4a49b47d-7020-4752-9daa-616da026d3f7")
      .order("occurred_on", { ascending: false });

    if (txnErr) throw txnErr;

    // 3. Fetch webhook logs
    const { data: logs, error: logsErr } = await supabase
      .from("webhook_logs")
      .select("id, created_at, reason, sms_text, user_id")
      .order("created_at", { ascending: false })
      .limit(100);

    return NextResponse.json({
      accounts,
      txns,
      logs: logsErr ? { error: logsErr.message } : logs
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
