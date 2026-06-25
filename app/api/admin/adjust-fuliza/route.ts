import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const FULIZA_MAX = 1500;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { balance } = body ?? {};

  if (typeof balance !== "number" || isNaN(balance) || balance < 0 || balance > FULIZA_MAX) {
    return NextResponse.json(
      { error: `Balance must be between 0 and ${FULIZA_MAX}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Resolve userId from the MPESA account (same pattern as webhook)
  const { data: mpesa } = await admin
    .from("accounts")
    .select("user_id")
    .eq("account_code", "main")
    .single();
  if (!mpesa) return NextResponse.json({ error: "MPESA account not found" }, { status: 404 });
  const userId = mpesa.user_id;

  const isActive = balance > 0;

  // Upsert Fuliza debt — same logic as upsertAutoDebt in the webhook
  const { data: existing } = await admin
    .from("debts")
    .select("id, principal")
    .eq("user_id", userId)
    .eq("source_identifier", "fuliza")
    .maybeSingle();

  let debt;
  if (existing) {
    const { data: updated, error } = await admin
      .from("debts")
      .update({
        creditor: "Safaricom Fuliza",
        debt_type: "fuliza",
        current_balance: balance,
        auto_tracked: true,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    debt = updated;
  } else {
    const { data: created, error } = await admin
      .from("debts")
      .insert({
        user_id: userId,
        creditor: "Safaricom Fuliza",
        debt_type: "fuliza",
        principal: balance,
        current_balance: balance,
        currency_code: "KES",
        auto_tracked: true,
        is_active: isActive,
        source_identifier: "fuliza",
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    debt = created;
  }

  return NextResponse.json({
    id: debt.id,
    current_balance: debt.current_balance,
    is_active: debt.is_active,
    action: existing ? "updated" : "created",
  });
}
