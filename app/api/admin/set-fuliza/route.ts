import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ONE-TIME: set Fuliza as a credit line (limit 1500, owed 0). DELETE after.
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data: accts } = await supabase.from("accounts").select("user_id").limit(1).single();
  const userId = accts?.user_id;
  if (!userId) return NextResponse.json({ error: "No user" }, { status: 404 });

  await supabase.from("debts").delete().eq("user_id", userId).eq("source_identifier", "fuliza");
  const { error } = await supabase.from("debts").insert({
    user_id:           userId,
    creditor:          "Safaricom Fuliza",
    debt_type:         "fuliza",
    principal:         1500.00,   // credit limit (max borrowable)
    current_balance:   0.00,      // currently owed (nothing drawn yet)
    currency_code:     "KES",
    is_active:         true,
    auto_tracked:      true,
    source_identifier: "fuliza",
    notes:             "Fuliza M-PESA credit line. Limit KES 1,500 (max borrowable when MPESA is depleted). Outstanding auto-updates from SMS.",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: debts } = await supabase
    .from("debts").select("creditor, principal, current_balance, is_active").eq("user_id", userId);
  return NextResponse.json({ status: "done", debts });
}
