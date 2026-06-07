import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.MPESA_WEBHOOK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch all accounts
  const { data: accounts } = await supabase.from("accounts").select("id, account_code, name, opening_balance");
  if (!accounts) {
    return NextResponse.json({ error: "No accounts found" }, { status: 404 });
  }

  const results: Record<string, any> = {};

  const calibrationPromises = accounts.map(async (acct: any) => {
    const paramVal = request.nextUrl.searchParams.get(acct.account_code);
    
    // Compute the net change for this account using the consistent logic
    let txns: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error: qErr } = await supabase
        .from("transactions")
        .select("account_id, transfer_account_id, amount, txn_type, metadata")
        .or(`account_id.eq.${acct.id},transfer_account_id.eq.${acct.id}`)
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (qErr) throw qErr;
      if (!data || data.length === 0) break;
      txns = txns.concat(data);
      if (data.length < pageSize) break;
      page++;
    }

    let net = 0;
    for (const t of txns ?? []) {
      const isCounter = t.metadata && (t.metadata as any).is_transfer_counter === true;
      if (isCounter) continue;

      const amt = Number(t.amount);
      if (t.txn_type === "income" && t.account_id === acct.id) {
        net += amt;
      } else if (t.txn_type === "expense" && t.account_id === acct.id) {
        net -= amt;
      } else if (t.txn_type === "transfer") {
        if (t.account_id === acct.id) net -= amt;
        if (t.transfer_account_id === acct.id) net += amt;
      }
    }

    if (paramVal !== null) {
      const stated = parseFloat(paramVal);
      if (isNaN(stated)) {
        throw new Error(`Invalid numeric value for parameter ${acct.account_code}: ${paramVal}`);
      }
      const newOpening = stated - net;
      await supabase.from("accounts").update({ opening_balance: newOpening }).eq("id", acct.id);
      
      results[acct.account_code] = {
        mutated: true,
        stated_target: stated,
        net_change: net,
        old_opening_balance: Number(acct.opening_balance),
        new_opening_balance: newOpening,
        calculated_balance: stated
      };
    } else {
      const calculated_balance = Number(acct.opening_balance) + net;
      results[acct.account_code] = {
        mutated: false,
        net_change: net,
        opening_balance: Number(acct.opening_balance),
        calculated_balance
      };
    }
  });

  try {
    await Promise.all(calibrationPromises);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Fetch all accounts to verify
  const { data: updatedAccounts } = await supabase.from("accounts").select("id, name, account_code, opening_balance");

  return NextResponse.json({
    message: "Accounts calibrated/calculated successfully",
    results,
    accounts: updatedAccounts?.map(a => ({ name: a.name, code: a.account_code, opening: a.opening_balance }))
  });
}
