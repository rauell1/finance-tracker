import { withAuth } from "@/lib/api-utils";
import { getBudgets, createBudget, getProjectedMonthEnd, getBudgetSuggestions } from "@/lib/queries";
import { budgetSchema } from "@/lib/validators/budget";
import { NextResponse } from "next/server";

export const GET = withAuth(async ({ user, request }) => {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? undefined;

  if (searchParams.get("projections") === "1") {
    const result = await getProjectedMonthEnd(month);
    return NextResponse.json(result);
  }

  if (searchParams.get("suggestions") === "1") {
    const result = await getBudgetSuggestions(month);
    return NextResponse.json(result);
  }

  const result = await getBudgets(month);
  return NextResponse.json(result);
}, "Failed to fetch budgets");

export const POST = withAuth(async ({ user, request }) => {
  const body = await request.json();
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const result = await createBudget({ user_id: user.id, ...parsed.data });
  return NextResponse.json(result, { status: 201 });
}, "Failed to create budget");
