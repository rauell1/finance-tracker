import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.MPESA_WEBHOOK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch all transactions that might be affected by Fuliza due date parsing
  // These are transactions where description contains "Fuliza" and occurred_on is in the future
  // Or we can just query all transactions with occurred_on >= '2026-06-04' (future relative to June 3rd)
  // or containing "Fuliza Access Fee" or "Fuliza transaction"
  const { data: txns, error: qErr } = await supabase
    .from("transactions")
    .select("id, occurred_on, metadata, description, created_at, user_id")
    .or("description.ilike.%Fuliza Access Fee%,description.ilike.%Fuliza transaction%");

  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  const updated = [];

  for (const t of txns ?? []) {
    const meta = t.metadata as Record<string, any> | null;
    if (!meta) continue;

    const parentReceipt = meta.parent_receipt || (meta.mpesa_receipt ? meta.mpesa_receipt.replace("-fee", "") : null);
    let targetDate = null;

    if (parentReceipt) {
      // Find parent transaction
      const { data: parent } = await supabase
        .from("transactions")
        .select("occurred_on")
        .eq("user_id", t.user_id)
        .eq("metadata->>mpesa_receipt", parentReceipt)
        .maybeSingle();

      if (parent) {
        targetDate = parent.occurred_on;
      }
    }

    if (!targetDate && t.created_at) {
      // Fallback to created_at date
      targetDate = t.created_at.split("T")[0];
    }

    if (targetDate && targetDate !== t.occurred_on) {
      await supabase
        .from("transactions")
        .update({ occurred_on: targetDate })
        .eq("id", t.id);

      updated.push({
        id: t.id,
        description: t.description,
        old_date: t.occurred_on,
        new_date: targetDate,
        parent_receipt: parentReceipt,
      });
    }
  }

  // Also calibrate all accounts after updating dates to ensure balances are correct
  const { data: accounts } = await supabase.from("accounts").select("id, name, account_code, opening_balance");
  const calibrationResults: Record<string, any> = {};

  if (accounts) {
    for (const acct of accounts) {
      let page = 0;
      const pageSize = 1000;
      let acctTxns: any[] = [];
      while (true) {
        const { data, error } = await supabase
          .from("transactions")
          .select("account_id, transfer_account_id, amount, txn_type, metadata")
          .or(`account_id.eq.${acct.id},transfer_account_id.eq.${acct.id}`)
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        acctTxns = acctTxns.concat(data);
        if (data.length < pageSize) break;
        page++;
      }

      let net = 0;
      for (const tx of acctTxns) {
        const isCounter = tx.metadata && (tx.metadata as any).is_transfer_counter === true;
        if (isCounter) continue;

        const amt = Number(tx.amount);
        if (tx.txn_type === "income" && tx.account_id === acct.id) {
          net += amt;
        } else if (tx.txn_type === "expense" && tx.account_id === acct.id) {
          net -= amt;
        } else if (tx.txn_type === "transfer") {
          if (tx.account_id === acct.id) net -= amt;
          if (tx.transfer_account_id === acct.id) net += amt;
        }
      }

      calibrationResults[acct.account_code] = {
        net_change: net,
        opening_balance: Number(acct.opening_balance),
        calculated_balance: Number(acct.opening_balance) + net
      };
    }
  }

  return NextResponse.json({
    message: "Transaction dates fixed and accounts calibrated successfully",
    updated_count: updated.length,
    updated_transactions: updated,
    calibrationResults
  });
}
