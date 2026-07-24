import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { account_id, target_balance } = body ?? {};

  if (!account_id || typeof target_balance !== "number" || isNaN(target_balance)) {
    return NextResponse.json({ error: "account_id and target_balance are required" }, { status: 400 });
  }

  // Fetch the account - RLS ensures this belongs to the signed-in user
  const { data: acct, error: acctErr } = await supabase
    .from("accounts")
    .select("id, user_id, account_code, name, opening_balance, currency_code")
    .eq("id", account_id)
    .single();

  if (acctErr || !acct) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Compute net transaction delta for this account (same logic as getAccounts)
  let txns: any[] = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
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

  const computedBalance = Number(acct.opening_balance) + net;
  const newOpening = target_balance - net;

  // Re-anchor the account's opening_balance so its computed balance equals the
  // target. This creates NO transaction, so it never pollutes reporting and
  // corrections cannot compound (the old behaviour injected a "Reconciliation
  // Adjustment" income/expense row, which double-counted and skewed totals).
  // Uses the admin client because the accounts table has no UPDATE policy for
  // authenticated users, so a session-client update would silently no-op.
  if (Math.abs(newOpening - Number(acct.opening_balance)) >= 0.01) {
    const admin = createAdminClient();
    const { error: updErr } = await admin
      .from("accounts")
      .update({ opening_balance: newOpening })
      .eq("id", acct.id)
      .eq("user_id", acct.user_id);
    if (updErr) {
      return NextResponse.json({ error: `Failed to re-anchor opening balance: ${updErr.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({
    account_code: acct.account_code,
    name: acct.name,
    old_opening_balance: Number(acct.opening_balance),
    new_opening_balance: newOpening,
    transaction_net: net,
    computed_before: computedBalance,
    resulting_balance: target_balance,
    reconciliation_applied: false
  });
}
