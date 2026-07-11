import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const diff = target_balance - computedBalance;

  if (Math.abs(diff) >= 0.01) {
    const txnType = diff > 0 ? "income" : "expense";
    
    // Resolve/create category locally
    let categoryId: string;
    try {
      const cat = await getOrCreateCategory(supabase, acct.user_id, "Balance Adjustment", txnType);
      categoryId = cat.id;
    } catch (catErr: any) {
      return NextResponse.json({ error: `Category resolution failed: ${catErr.message}` }, { status: 500 });
    }

    const { error: insertErr } = await supabase.from("transactions").insert({
      user_id: acct.user_id,
      account_id: acct.id,
      category_id: categoryId,
      txn_type: txnType,
      amount: Math.abs(diff),
      currency_code: acct.currency_code,
      occurred_on: new Date().toISOString().split("T")[0],
      description: "Reconciliation Adjustment (Manual balance sync)",
      metadata: {
        source: "manual_calibration",
        stated_balance: target_balance,
        computed_balance: computedBalance,
        original_net: net,
        is_reconciliation: true,
        mpesa_receipt: `ADJ-MAN-${Date.now()}`
      }
    });

    if (insertErr) {
      return NextResponse.json({ error: `Failed to insert reconciliation transaction: ${insertErr.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({
    account_code: acct.account_code,
    name: acct.name,
    old_opening_balance: Number(acct.opening_balance),
    new_opening_balance: Number(acct.opening_balance), // remains unchanged
    transaction_net: net,
    resulting_balance: target_balance,
    reconciliation_applied: Math.abs(diff) >= 0.01,
    reconciliation_amount: Math.abs(diff) >= 0.01 ? Math.abs(diff) : 0,
    reconciliation_type: diff > 0 ? "income" : "expense"
  });
}

async function getOrCreateCategory(
  supabase: any,
  userId: string,
  categoryName: string,
  type: "income" | "expense"
): Promise<{ id: string }> {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("name", categoryName)
    .eq("type", type)
    .maybeSingle();

  if (existing) return existing;

  const color = type === "income" ? "#10B981" : "#64748B";
  const { data: created } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: categoryName,
      type: type,
      color: color,
      is_system: false,
    })
    .select("id")
    .maybeSingle();

  if (created) return created;

  const { data: fb } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .limit(1)
    .maybeSingle();

  if (fb) return fb;
  throw new Error(`Category ${categoryName} could not be resolved`);
}
