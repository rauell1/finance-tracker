import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Recompute an account's opening_balance so its computed balance equals `stated`.
async function setBalance(supabase: any, accountId: string, stated: number) {
  const [{ data: inc }, { data: exp }, { data: xOut }, { data: xIn }] = await Promise.all([
    supabase.from("transactions").select("amount").eq("account_id", accountId).eq("txn_type", "income"),
    supabase.from("transactions").select("amount").eq("account_id", accountId).eq("txn_type", "expense"),
    supabase.from("transactions").select("amount").eq("account_id", accountId).eq("txn_type", "transfer"),
    supabase.from("transactions").select("amount").eq("transfer_account_id", accountId).eq("txn_type", "transfer"),
  ]);
  const net =
    (inc ?? []).reduce((s: number, t: any) => s + Number(t.amount), 0) -
    (exp ?? []).reduce((s: number, t: any) => s + Number(t.amount), 0) +
    (xIn ?? []).reduce((s: number, t: any) => s + Number(t.amount), 0) -
    (xOut ?? []).reduce((s: number, t: any) => s + Number(t.amount), 0);
  await supabase.from("accounts").update({ opening_balance: stated - net }).eq("id", accountId);
  return { net, opening_balance: stated - net };
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== "cLS4oOhHsVYmA8wiv1tG3PWZReyu06zK") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rqyikracpmpjhjvdtbxi.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY missing" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Fetch all accounts
  const { data: accounts } = await supabase.from("accounts").select("id, account_code");
  if (!accounts) {
    return NextResponse.json({ error: "No accounts found" }, { status: 404 });
  }

  const results: Record<string, any> = {};

  for (const acct of accounts) {
    if (acct.account_code === "main") {
      results.main = await setBalance(supabase, acct.id, 0.00); // Calibrated to 0.00 KES
    } else if (acct.account_code === "kcb_mpesa") {
      results.kcb_mpesa = await setBalance(supabase, acct.id, 3001.00); // Calibrated to 3001.00 KES
    } else if (acct.account_code === "mshwari") {
      results.mshwari = await setBalance(supabase, acct.id, 3000.27); // Calibrated to 3000.27 KES
    } else if (acct.account_code === "bank_c") {
      results.bank_c = await setBalance(supabase, acct.id, 13.46); // Calibrated to 13.46 KES
    }
  }

  // Find or create Fuliza debt
  // We will calibrate the Fuliza outstanding debt to exactly 124.68 KES (Available limit: 1375.32 KES out of 1500.00 KES)
  const { data: mpesa } = await supabase.from("accounts").select("user_id").eq("account_code", "main").single();
  if (mpesa) {
    const { data: existing } = await supabase
      .from("debts")
      .select("id")
      .eq("user_id", mpesa.user_id)
      .eq("source_identifier", "fuliza")
      .maybeSingle();

    if (existing) {
      await supabase.from("debts").update({
        current_balance: 124.68,
        principal: 124.68,
        is_active: true,
        auto_tracked: true
      }).eq("id", existing.id);
      results.fuliza = { updated: true, id: existing.id, outstanding: 124.68 };
    } else {
      const { data: inserted } = await supabase.from("debts").insert({
        user_id: mpesa.user_id,
        creditor: "Safaricom Fuliza",
        debt_type: "fuliza",
        principal: 124.68,
        current_balance: 124.68,
        currency_code: "KES",
        auto_tracked: true,
        is_active: true,
        source_identifier: "fuliza"
      }).select("id").single();
      results.fuliza = { inserted: true, id: inserted?.id, outstanding: 124.68 };
    }
  }

  // Fetch all accounts to verify
  const { data: updatedAccounts } = await supabase.from("accounts").select("*");

  return NextResponse.json({
    message: "All accounts and Fuliza debt calibrated successfully",
    results,
    accounts: updatedAccounts?.map(a => ({ name: a.name, code: a.account_code, opening: a.opening_balance }))
  });
}
