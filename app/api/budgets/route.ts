import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBudgets, createBudget, getProjectedMonthEnd, getBudgetSuggestions } from "@/lib/queries";
import { budgetSchema } from "@/lib/validators/budget";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch budgets";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const parsed = budgetSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const result = await createBudget({ user_id: user.id, ...parsed.data });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create budget";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
