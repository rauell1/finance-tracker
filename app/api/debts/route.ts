import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDebts, createDebt } from "@/lib/queries";
import type { DebtType } from "@/types/domain";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await getDebts();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    if (!body.creditor) return NextResponse.json({ error: "Missing creditor" }, { status: 400 });
    const result = await createDebt({
      user_id: user.id,
      creditor: String(body.creditor),
      debt_type: (body.debt_type ?? "loan") as DebtType,
      principal: body.principal ? Number(body.principal) : 0,
      current_balance: body.current_balance != null ? Number(body.current_balance) : undefined,
      interest_rate: body.interest_rate != null ? Number(body.interest_rate) : null,
      monthly_payment: body.monthly_payment != null ? Number(body.monthly_payment) : null,
      due_date: body.due_date ?? null,
      currency_code: body.currency_code ?? "KES",
      notes: body.notes ?? null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
