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

  const calibrationPromises = accounts.map(async (acct) => {
    const paramVal = request.nextUrl.searchParams.get(acct.account_code);
    
    // Compute the net change for this account
    const [{ data: inc }, { data: exp }, { data: xOut }, { data: xIn }] = await Promise.all([
      supabase.from("transactions").select("amount").eq("account_id", acct.id).eq("txn_type", "income"),
      supabase.from("transactions").select("amount").eq("account_id", acct.id).eq("txn_type", "expense"),
      supabase.from("transactions").select("amount").eq("account_id", acct.id).eq("txn_type", "transfer"),
      supabase.from("transactions").select("amount").eq("transfer_account_id", acct.id).eq("txn_type", "transfer"),
    ]);

    const net =
      (inc ?? []).reduce((s: number, t: any) => s + Number(t.amount), 0) -
      (exp ?? []).reduce((s: number, t: any) => s + Number(t.amount), 0) +
      (xIn ?? []).reduce((s: number, t: any) => s + Number(t.amount), 0) -
      (xOut ?? []).reduce((s: number, t: any) => s + Number(t.amount), 0);

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
