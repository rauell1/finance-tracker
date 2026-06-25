import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  // Auth check — only the signed-in owner can call this
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { account_id, target_balance } = body ?? {};

  if (!account_id || typeof target_balance !== "number" || isNaN(target_balance)) {
    return NextResponse.json({ error: "account_id and target_balance are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch the account
  const { data: acct, error: acctErr } = await admin
    .from("accounts")
    .select("id, account_code, name, opening_balance, user_id")
    .eq("id", account_id)
    .single();

  if (acctErr || !acct) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Compute the net transaction delta for this account (same logic as getAccounts / calibrate)
  let txns: any[] = [];
  let page = 0;
  while (true) {
    const { data, error } = await admin
      .from("transactions")
      .select("account_id, transfer_account_id, amount, txn_type, metadata")
      .or(`account_id.eq.${acct.id},transfer_account_id.eq.${acct.id}`)
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    txns = txns.concat(data);
    if (data.length < 1000) break;
    page++;
  }

  let net = 0;
  for (const t of txns) {
    if (t.metadata?.is_transfer_counter === true) continue;
    const amt = Number(t.amount);
    if (t.txn_type === "income" && t.account_id === acct.id) net += amt;
    else if (t.txn_type === "expense" && t.account_id === acct.id) net -= amt;
    else if (t.txn_type === "transfer") {
      if (t.account_id === acct.id) net -= amt;
      if (t.transfer_account_id === acct.id) net += amt;
    }
  }

  const old_opening = Number(acct.opening_balance);
  const new_opening = target_balance - net;

  const { error: updateErr } = await admin
    .from("accounts")
    .update({ opening_balance: new_opening, updated_at: new Date().toISOString() })
    .eq("id", acct.id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({
    account_code: acct.account_code,
    name: acct.name,
    old_opening_balance: old_opening,
    new_opening_balance: new_opening,
    transaction_net: net,
    resulting_balance: target_balance,
  });
}
