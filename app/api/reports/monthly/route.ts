import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMonthStart } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month"); // YYYY-MM
    const monthStart = monthParam ? `${monthParam}-01` : getMonthStart(new Date());
    const monthEnd = new Date(monthStart + "T00:00:00");
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    const monthEndStr = monthEnd.toISOString().split("T")[0];

    // Fetch all transactions for the month
    const { data: txns } = await supabase
      .from("transactions")
      .select("*, category:categories!category_id(id, name, color), account:accounts!account_id(id, name, account_code)")
      .eq("user_id", user.id)
      .gte("occurred_on", monthStart)
      .lt("occurred_on", monthEndStr)
      .order("occurred_on", { ascending: false });

    const transactions = txns ?? [];

    // Income / Expense summary
    let totalIncome = 0, totalExpense = 0;
    const categoryTotals = new Map<string, { name: string; color: string; amount: number }>();
    const merchantTotals = new Map<string, number>();

    for (const t of transactions) {
      const amt = Number(t.amount);
      if (t.txn_type === "income") totalIncome += amt;
      else if (t.txn_type === "expense") totalExpense += amt;

      if (t.txn_type === "expense" && t.category) {
        const cat = Array.isArray(t.category) ? t.category[0] : t.category;
        if (cat) {
          const key = cat.id;
          const existing = categoryTotals.get(key);
          if (existing) existing.amount += amt;
          else categoryTotals.set(key, { name: cat.name, color: cat.color, amount: amt });
        }
      }

      const meta = (t.metadata ?? {}) as Record<string, unknown>;
      const cp = (meta.counterparty as string) ?? null;
      if (cp && t.txn_type === "expense") {
        merchantTotals.set(cp, (merchantTotals.get(cp) ?? 0) + amt);
      }
    }

    const expenseByCategory = Array.from(categoryTotals.values()).sort((a, b) => b.amount - a.amount);
    const topMerchants = Array.from(merchantTotals.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Account balances
    const { data: accounts } = await supabase.from("accounts").select("*").eq("user_id", user.id).eq("is_archived", false);

    // Budget performance
    const { data: budgets } = await supabase.from("budgets").select("*, category:categories!category_id(id, name, color)").eq("month_start", monthStart);
    const budgetPerf = (budgets ?? []).map((b) => {
      const spent = transactions.filter((t) => t.category_id === b.category_id && t.txn_type === (b.txn_type ?? "expense")).reduce((s, t) => s + Number(t.amount), 0);
      return { category: (Array.isArray(b.category) ? b.category[0] : b.category)?.name ?? "Unknown", budget: Number(b.amount), spent, remaining: Number(b.amount) - spent };
    });

    // Savings goals
    const { data: goals } = await supabase.from("savings_goals").select("*").eq("user_id", user.id).eq("is_completed", false);

    return NextResponse.json({
      month: monthStart.slice(0, 7),
      income: { total: totalIncome, count: transactions.filter((t) => t.txn_type === "income").length },
      expense: { total: totalExpense, count: transactions.filter((t) => t.txn_type === "expense").length, byCategory: expenseByCategory },
      net: totalIncome - totalExpense,
      topMerchants,
      accounts: (accounts ?? []).map((a) => ({ name: a.name, code: a.account_code, balance: Number(a.current_balance) })),
      budgetPerformance: budgetPerf,
      savingsGoals: (goals ?? []).map((g) => ({ name: g.name, target: Number(g.target_amount), current: Number(g.current_amount), progress: Number(g.target_amount) > 0 ? Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100) : 0 })),
      transactionCount: transactions.length,
      transactions: transactions.map((t) => ({
        date: t.occurred_on,
        description: t.description,
        type: t.txn_type,
        amount: Number(t.amount),
        category: (Array.isArray(t.category) ? t.category[0] : t.category)?.name ?? "",
        account: (Array.isArray(t.account) ? t.account[0] : t.account)?.name ?? "",
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
