import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FULIZA_MAX = 1900;

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

  const isActive = balance > 0;

  // Upsert Fuliza debt for the signed-in user - RLS handles the user_id filter
  const { data: existing } = await supabase
    .from("debts")
    .select("id, principal")
    .eq("source_identifier", "fuliza")
    .maybeSingle();

  let debt;
  if (existing) {
    const { data: updated, error } = await supabase
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
    const { data: created, error } = await supabase
      .from("debts")
      .insert({
        user_id: user.id,
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
