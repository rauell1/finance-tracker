import { withAuth } from "@/lib/api-utils";
import { getRecurringObligations, createObligation } from "@/lib/queries";
import { NextResponse } from "next/server";
import type { ObligationType, Recurrence } from "@/types/domain";

export const GET = withAuth(async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as ObligationType | null;
  const result = await getRecurringObligations(type ? { type } : undefined);
  return NextResponse.json(result);
}, "Failed to fetch recurring obligations");

export const POST = withAuth(async ({ user, request }) => {
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
}, "Failed to create recurring obligation");
