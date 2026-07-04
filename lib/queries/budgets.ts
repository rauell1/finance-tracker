import { createClient } from "@/lib/supabase/server";
import type { Budget } from "@/types/domain";
import { getMonthStart } from "@/lib/utils";

export interface BudgetProjection {
  category_id: string;
  category_name: string;
  budget: number;
  spent: number;
  projected: number;
  at_risk: boolean;
}

export interface BudgetSuggestion {
  category_id: string;
  category_name: string;
  avg_spend: number;
  suggested_amount: number;
}

export async function getProjectedMonthEnd(month?: string): Promise<BudgetProjection[]> {
  const supabase = await createClient();
  const targetMonth = month ?? getMonthStart(new Date());
  const monthStart = new Date(targetMonth + "T00:00:00");
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  const today = new Date();
  const dayOfMonth = Math.max(today.getDate(), 1);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const ratio = daysInMonth / dayOfMonth;

  const budgets = await getBudgets(targetMonth, "expense");
  return budgets.map((b) => ({
    category_id: b.category_id,
    category_name: b.category?.name ?? "Unknown",
    budget: b.amount,
    spent: b.spent,
    projected: Math.round(b.spent * ratio * 100) / 100,
    at_risk: b.spent * ratio > b.amount,
  }));
}

export async function getBudgetSuggestions(month?: string): Promise<BudgetSuggestion[]> {
  const supabase = await createClient();
  const targetMonth = month ?? getMonthStart(new Date());
  const suggestions: BudgetSuggestion[] = [];

  // Look at last 3 months of spending per category
  const months: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(targetMonth + "T00:00:00");
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().split("T")[0]);
  }

  const oldestMonth = months[months.length - 1];
  const newestMonth = months[0];
  const newestMonthEnd = new Date(newestMonth + "T00:00:00");
  newestMonthEnd.setMonth(newestMonthEnd.getMonth() + 1);
  const newestMonthEndStr = newestMonthEnd.toISOString().split("T")[0];

  const { data: cats } = await supabase.from("categories").select("id, name").eq("type", "expense");
  if (!cats) return [];

  const catIds = cats.map((c) => c.id);
  if (catIds.length === 0) return [];

  // Query all transactions in a single bulk query
  const { data: allTxns, error: qErr } = await supabase
    .from("transactions")
    .select("category_id, amount, occurred_on")
    .eq("txn_type", "expense")
    .in("category_id", catIds)
    .gte("occurred_on", oldestMonth)
    .lt("occurred_on", newestMonthEndStr);

  if (qErr) throw qErr;

  // Group and sum in memory by category and month prefix (YYYY-MM)
  const spendMap = new Map<string, Map<string, number>>();
  for (const catId of catIds) {
    spendMap.set(catId, new Map<string, number>());
  }

  for (const t of allTxns ?? []) {
    const mStart = t.occurred_on.slice(0, 7) + "-01";
    const catMap = spendMap.get(t.category_id);
    if (catMap) {
      catMap.set(mStart, (catMap.get(mStart) ?? 0) + Number(t.amount));
    }
  }

  for (const cat of cats) {
    let total = 0;
    let monthCount = 0;
    const catMap = spendMap.get(cat.id);

    for (const m of months) {
      const sum = catMap?.get(m) ?? 0;
      if (sum > 0) {
        total += sum;
        monthCount++;
      }
    }

    if (monthCount >= 2) {
      const avg = total / monthCount;
      suggestions.push({
        category_id: cat.id,
        category_name: cat.name,
        avg_spend: Math.round(avg),
        suggested_amount: Math.round(avg * 1.1),
      });
    }
  }

  return suggestions.sort((a, b) => b.avg_spend - a.avg_spend);
}

export async function getOverBudgetAlerts(): Promise<{ category_name: string; pct: number; spent: number; budget: number }[]> {
  const budgets = await getBudgets(undefined, "expense");
  return budgets
    .filter((b) => b.pct_used >= 80)
    .map((b) => ({
      category_name: b.category?.name ?? "Unknown",
      pct: b.pct_used,
      spent: b.spent,
      budget: b.amount,
    }));
}
export async function getBudgets(month?: string, txnType?: "income" | "expense"): Promise<Budget[]> {
  const supabase = await createClient();
  const targetMonth = month ?? getMonthStart(new Date());
  let bq = supabase.from("budgets")
    .select("*, category:categories!category_id(id, name, color)")
    .eq("month_start", targetMonth)
    .order("amount", { ascending: false });
  if (txnType) bq = bq.eq("txn_type", txnType);
  const { data: budgets, error } = await bq;
  if (error) throw error;
  const ids = (budgets ?? []).map((b) => b.category_id);
  const spendMap: Record<string, number> = {};
  for (const id of ids) spendMap[id] = 0;
  if (ids.length > 0) {
    const end = new Date(targetMonth + "T00:00:00");
    end.setMonth(end.getMonth() + 1);
    // Need per-budget txn type — pull both kinds (cheap) and bucket per category id later.
    const { data } = await supabase.from("transactions")
      .select("category_id, amount, txn_type, description")
      .in("txn_type", ["income", "expense"])
      .in("category_id", ids)
      .gte("occurred_on", targetMonth)
      .lt("occurred_on", end.toISOString().split("T")[0]);
    const txnMap: Record<string, { income: number; expense: number }> = {};
    for (const id of ids) txnMap[id] = { income: 0, expense: 0 };
    for (const r of data ?? []) {
      if (r.description === "Fuliza repayment") continue;
      if (r.txn_type === "income" || r.txn_type === "expense") {
        txnMap[r.category_id][r.txn_type as "income" | "expense"] += Number(r.amount);
      }
    }
    for (const b of budgets ?? []) {
      const bt = (b.txn_type ?? "expense") as "income" | "expense";
      spendMap[b.category_id] = txnMap[b.category_id]?.[bt] ?? 0;
    }
  }
  return (budgets ?? []).map((b) => {
    const spent = spendMap[b.category_id] ?? 0;
    const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const status: "safe"|"warning"|"over" = pct >= 100 ? "over" : pct >= b.alert_threshold_pct ? "warning" : "safe";
    return { ...b, txn_type: b.txn_type ?? "expense", spent, remaining: b.amount - spent, pct_used: Math.min(pct, 999), status } as Budget;
  });
}
export async function createBudget(input: { user_id?: string; category_id: string; month_start: string; amount: number; currency_code: string; alert_threshold_pct: number; txn_type?: "income" | "expense" }): Promise<Budget> {
  const supabase = await createClient();
  const payload = { ...input, txn_type: input.txn_type ?? "expense" };
  const { data, error } = await supabase.from("budgets").insert(payload).select("*, category:categories!category_id(id, name, color)").single();
  if (error) throw error;
  return { ...data, txn_type: data.txn_type ?? "expense", spent: 0, remaining: data.amount, pct_used: 0, status: "safe" } as Budget;
}
export async function updateBudget(id: string, updates: Record<string, unknown>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").update(updates).eq("id", id);
  if (error) throw error;
}
export async function deleteBudget(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}
