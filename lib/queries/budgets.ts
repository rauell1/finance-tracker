import { createClient } from "@/lib/supabase/server";
import type { Budget } from "@/types/domain";
import { getMonthStart } from "@/lib/utils";
export async function getBudgets(month?: string): Promise<Budget[]> {
  const supabase = await createClient();
  const targetMonth = month ?? getMonthStart(new Date());
  const { data: budgets, error } = await supabase.from("budgets")
    .select("*, category:categories!category_id(id, name, color)").eq("month_start", targetMonth).order("amount", { ascending: false });
  if (error) throw error;
  const ids = budgets.map((b) => b.category_id);
  const spendMap: Record<string, number> = {};
  for (const id of ids) spendMap[id] = 0;
  if (ids.length > 0) {
    const end = new Date(targetMonth + "T00:00:00");
    end.setMonth(end.getMonth() + 1);
    const { data } = await supabase.from("transactions").select("category_id, amount").eq("txn_type", "expense").in("category_id", ids).gte("occurred_on", targetMonth).lt("occurred_on", end.toISOString().split("T")[0]);
    for (const r of data ?? []) spendMap[r.category_id] += Number(r.amount);
  }
  return budgets.map((b) => {
    const spent = spendMap[b.category_id] ?? 0;
    const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const status: "safe"|"warning"|"over" = pct >= 100 ? "over" : pct >= b.alert_threshold_pct ? "warning" : "safe";
    return { ...b, spent, remaining: b.amount - spent, pct_used: Math.min(pct, 999), status } as Budget;
  });
}
export async function createBudget(input: { user_id?: string; category_id: string; month_start: string; amount: number; currency_code: string; alert_threshold_pct: number }): Promise<Budget> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("budgets").insert(input).select("*, category:categories!category_id(id, name, color)").single();
  if (error) throw error;
  return { ...data, spent: 0, remaining: data.amount, pct_used: 0, status: "safe" } as Budget;
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
