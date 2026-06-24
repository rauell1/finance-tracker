import { withAuth } from "@/lib/api-utils";
import { getDebts, createDebt } from "@/lib/queries";
import { NextResponse } from "next/server";
import type { DebtType } from "@/types/domain";

export const GET = withAuth(async () => {
  const result = await getDebts();
  return NextResponse.json(result);
}, "Failed to fetch debts");

export const POST = withAuth(async ({ user, request }) => {
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
}, "Failed to create debt");
