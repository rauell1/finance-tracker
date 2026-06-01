import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecurringObligations, createObligation } from "@/lib/queries";
import type { ObligationType, Recurrence } from "@/types/domain";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as ObligationType | null;
    const result = await getRecurringObligations(type ? { type } : undefined);
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
    if (!body.name || !body.amount || !body.obligation_type) {
      return NextResponse.json({ error: "Missing name, amount, or obligation_type" }, { status: 400 });
    }
    const result = await createObligation({
      user_id: user.id,
      obligation_type: body.obligation_type as ObligationType,
      name: String(body.name),
      category_id: body.category_id ?? null,
      account_id: body.account_id ?? null,
      amount: Number(body.amount),
      currency_code: body.currency_code ?? "KES",
      recurrence: (body.recurrence ?? "monthly") as Recurrence,
      due_day_of_month: body.due_day_of_month ?? null,
      next_due_date: body.next_due_date ?? null,
      match_keywords: body.match_keywords ?? null,
      notes: body.notes ?? null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
