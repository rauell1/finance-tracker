import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ONE-TIME: set KCB M-PESA and M-Shwari to correct balances. DELETE after running.
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  async function setBalance(accountId: string, stated: number) {
    const [{ data: inc }, { data: exp }, { data: xOut }, { data: xIn }] = await Promise.all([
      supabase.from("transactions").select("amount").eq("account_id", accountId).eq("txn_type", "income"),
      supabase.from("transactions").select("amount").eq("account_id", accountId).eq("txn_type", "expense"),
      supabase.from("transactions").select("amount").eq("account_id", accountId).eq("txn_type", "transfer"),
      supabase.from("transactions").select("amount").eq("transfer_account_id", accountId).eq("txn_type", "transfer"),
    ]);
    const net =
      (inc ?? []).reduce((s, t) => s + Number(t.amount), 0) -
      (exp ?? []).reduce((s, t) => s + Number(t.amount), 0) +
      (xIn ?? []).reduce((s, t) => s + Number(t.amount), 0) -
      (xOut ?? []).reduce((s, t) => s + Number(t.amount), 0);
    await supabase.from("accounts").update({ opening_balance: stated - net }).eq("id", accountId);
    return { net, new_opening: stated - net, computed_current: stated };
  }

  const { data: accounts } = await supabase.from("accounts").select("id, account_code, opening_balance");
  const kcb     = accounts?.find(a => a.account_code === "kcb_mpesa");
  const mshwari = accounts?.find(a => a.account_code === "mshwari");

  if (!kcb || !mshwari) return NextResponse.json({ error: "Accounts not found" }, { status: 404 });

  const kcbResult     = await setBalance(kcb.id,     3001.00);
  const mshwariResult = await setBalance(mshwari.id, 3000.00);

  const { data: final } = await supabase.from("accounts").select("account_code, name, opening_balance").order("account_code");

  return NextResponse.json({
    status: "done",
    kcb_mpesa: kcbResult,
    mshwari: mshwariResult,
    accounts: final,
  });
}
