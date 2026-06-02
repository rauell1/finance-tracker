import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ONE-TIME: remove duplicate sbm_webhook entries (partial dupes of the complete csv_import set). DELETE after.
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();

  // Delete the 15 partial-duplicate SBM entries imported as sbm_webhook
  const { data: deleted, error } = await supabase
    .from("transactions")
    .delete()
    .contains("metadata", { source: "sbm_webhook" })
    .select("id, occurred_on, amount, description");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalibrate SBM to exact statement closing balance
  const { data: accts } = await supabase.from("accounts").select("id, account_code");
  const sbm = accts?.find(a => a.account_code === "bank_c");
  if (sbm) {
    const [{ data: inc }, { data: exp }, { data: xOut }, { data: xIn }] = await Promise.all([
      supabase.from("transactions").select("amount").eq("account_id", sbm.id).eq("txn_type", "income"),
      supabase.from("transactions").select("amount").eq("account_id", sbm.id).eq("txn_type", "expense"),
      supabase.from("transactions").select("amount").eq("account_id", sbm.id).eq("txn_type", "transfer"),
      supabase.from("transactions").select("amount").eq("transfer_account_id", sbm.id).eq("txn_type", "transfer"),
    ]);
    const net =
      (inc ?? []).reduce((s, t) => s + Number(t.amount), 0) -
      (exp ?? []).reduce((s, t) => s + Number(t.amount), 0) +
      (xIn ?? []).reduce((s, t) => s + Number(t.amount), 0) -
      (xOut ?? []).reduce((s, t) => s + Number(t.amount), 0);
    await supabase.from("accounts").update({ opening_balance: 13.46 - net }).eq("id", sbm.id);
  }

  const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true });
  return NextResponse.json({ status: "done", deleted_count: deleted?.length ?? 0, deleted, remaining_total: count });
}
