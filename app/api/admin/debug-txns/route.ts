import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.MPESA_WEBHOOK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const [
    { data: accounts },
    { data: txns }
  ] = await Promise.all([
    supabase.from("accounts").select("id, name, account_code, opening_balance"),
    supabase.from("transactions").select("id, account_id, transfer_account_id, amount, txn_type, occurred_on, description, metadata, created_at").order("occurred_on", { ascending: false })
  ]);

  return NextResponse.json({
    accounts,
    txns
  });
}
