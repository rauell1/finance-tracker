import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ONE-TIME: reset all account opening_balances to 0. DELETE after running.
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("accounts")
    .update({ opening_balance: 0 })
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = await supabase.from("accounts").select("name, opening_balance").order("account_code");
  return NextResponse.json({ status: "reset", accounts: data });
}
