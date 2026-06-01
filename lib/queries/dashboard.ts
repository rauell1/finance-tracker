import { createClient } from "@/lib/supabase/server";
import type { KPIData, MonthlyTrend, CategoryBreakdown, AccountComparison } from "@/types/domain";
import { getMonthStart, normalizeDescription } from "@/lib/utils";
export async function getKPIData(month?: string): Promise<KPIData> {
  const supabase = await createClient();
  const targetMonth = month ?? getMonthStart(new Date());
  const end = new Date(targetMonth + "T00:00:00");
  end.setMonth(end.getMonth() + 1);
  const endStr = end.toISOString().split("T")[0];
  const { data: cur } = await supabase.from("transactions").select("txn_type, amount").in("txn_type", ["income","expense"]).gte("occurred_on", targetMonth).lt("occurred_on", endStr);
  let monthlyIncome = 0, monthlyExpense = 0;
  for (const t of cur ?? []) { if (t.txn_type === "income") monthlyIncome += Number(t.amount); else monthlyExpense += Number(t.amount); }
  const prev = new Date(targetMonth + "T00:00:00");
  prev.setMonth(prev.getMonth() - 1);
  const prevStart = prev.toISOString().split("T")[0];
  const { data: prevData } = await supabase.from("transactions").select("txn_type, amount").in("txn_type", ["income","expense"]).gte("occurred_on", prevStart).lt("occurred_on", targetMonth);
  let prevIncome = 0, prevExpense = 0;
  for (const t of prevData ?? []) { if (t.txn_type === "income") prevIncome += Number(t.amount); else prevExpense += Number(t.amount); }
  const { data: accounts } = await supabase.from("accounts").select("id, opening_balance").eq("is_archived", false);
  let totalBalance = (accounts ?? []).reduce((s, a) => s + Number(a.opening_balance), 0);
  const ids = (accounts ?? []).map((a) => a.id);
  if (ids.length > 0) {
    const [{ data: outflows }, { data: inflows }] = await Promise.all([
      supabase.from("transactions").select("account_id, amount, txn_type").in("account_id", ids),
      supabase.from("transactions").select("transfer_account_id, amount").in("transfer_account_id", ids).not("transfer_account_id", "is", null),
    ]);
    for (const t of outflows ?? []) {
      if (t.txn_type === "income") totalBalance += Number(t.amount);
      else totalBalance -= Number(t.amount);
    }
    for (const t of inflows ?? []) totalBalance += Number(t.amount);
  }
  return {
    totalBalance, monthlyIncome, monthlyExpense, netCashflow: monthlyIncome - monthlyExpense,
    incomeChange: prevIncome > 0 ? ((monthlyIncome - prevIncome) / prevIncome) * 100 : 0,
    expenseChange: prevExpense > 0 ? ((monthlyExpense - prevExpense) / prevExpense) * 100 : 0,
  };
}
export async function getMonthlyTrend(months = 6): Promise<MonthlyTrend[]> {
  const supabase = await createClient();
  const trends: MonthlyTrend[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
    const start = d.toISOString().split("T")[0];
    d.setMonth(d.getMonth() + 1);
    const end = d.toISOString().split("T")[0];
    const { data } = await supabase.from("transactions").select("txn_type, amount").in("txn_type", ["income","expense"]).gte("occurred_on", start).lt("occurred_on", end);
    let income = 0, expense = 0;
    for (const t of data ?? []) { if (t.txn_type === "income") income += Number(t.amount); else expense += Number(t.amount); }
    trends.push({ month: start.slice(0, 7), income, expense, net: income - expense });
  }
  return trends;
}
export async function getCategoryBreakdown(month?: string): Promise<CategoryBreakdown[]> {
  const supabase = await createClient();
  const targetMonth = month ?? getMonthStart(new Date());
  const end = new Date(targetMonth + "T00:00:00"); end.setMonth(end.getMonth() + 1);
  const { data } = await supabase.from("transactions").select("category_id, amount, category:categories!category_id(name, color)").eq("txn_type", "expense").gte("occurred_on", targetMonth).lt("occurred_on", end.toISOString().split("T")[0]);
  const map = new Map<string, { name: string; color: string; amount: number }>();
  let total = 0;
  for (const r of data ?? []) {
    const cat = (Array.isArray(r.category) ? r.category[0] : r.category) as { name: string; color: string } | null;
    const amt = Number(r.amount); total += amt;
    const e = map.get(r.category_id);
    if (e) e.amount += amt;
    else map.set(r.category_id, { name: cat?.name ?? "Other", color: cat?.color ?? "#64748B", amount: amt });
  }
  return Array.from(map.entries()).map(([id, v]) => ({ category_id: id, category_name: v.name, color: v.color, amount: v.amount, percentage: total > 0 ? (v.amount / total) * 100 : 0 })).sort((a, b) => b.amount - a.amount);
}
export async function getAccountComparison(month?: string): Promise<AccountComparison[]> {
  const supabase = await createClient();
  const targetMonth = month ?? getMonthStart(new Date());
  const end = new Date(targetMonth + "T00:00:00"); end.setMonth(end.getMonth() + 1);
  const endStr = end.toISOString().split("T")[0];
  const { data: accounts } = await supabase.from("accounts").select("*").eq("is_archived", false).order("account_code");
  if (!accounts) return [];
  const results: AccountComparison[] = [];
  for (const a of accounts) {
    const [
      { data: inc }, { data: exp }, { data: tout }, { data: tin },
      { data: incLifetime }, { data: expLifetime }, { data: toutLifetime }, { data: tinLifetime }
    ] = await Promise.all([
      supabase.from("transactions").select("amount").eq("account_id", a.id).eq("txn_type", "income").gte("occurred_on", targetMonth).lt("occurred_on", endStr),
      supabase.from("transactions").select("amount").eq("account_id", a.id).eq("txn_type", "expense").gte("occurred_on", targetMonth).lt("occurred_on", endStr),
      supabase.from("transactions").select("amount").eq("account_id", a.id).eq("txn_type", "transfer").gte("occurred_on", targetMonth).lt("occurred_on", endStr),
      supabase.from("transactions").select("amount").eq("transfer_account_id", a.id).eq("txn_type", "transfer").gte("occurred_on", targetMonth).lt("occurred_on", endStr),
      supabase.from("transactions").select("amount").eq("account_id", a.id).eq("txn_type", "income").lt("occurred_on", endStr),
      supabase.from("transactions").select("amount").eq("account_id", a.id).eq("txn_type", "expense").lt("occurred_on", endStr),
      supabase.from("transactions").select("amount").eq("account_id", a.id).eq("txn_type", "transfer").lt("occurred_on", endStr),
      supabase.from("transactions").select("amount").eq("transfer_account_id", a.id).eq("txn_type", "transfer").lt("occurred_on", endStr),
    ]);
    const income = (inc ?? []).reduce((s, t) => s + Number(t.amount), 0) + (tin ?? []).reduce((s, t) => s + Number(t.amount), 0);
    const expense = (exp ?? []).reduce((s, t) => s + Number(t.amount), 0) + (tout ?? []).reduce((s, t) => s + Number(t.amount), 0);
    const lifetimeIncome = (incLifetime ?? []).reduce((s, t) => s + Number(t.amount), 0) + (tinLifetime ?? []).reduce((s, t) => s + Number(t.amount), 0);
    const lifetimeExpense = (expLifetime ?? []).reduce((s, t) => s + Number(t.amount), 0) + (toutLifetime ?? []).reduce((s, t) => s + Number(t.amount), 0);
    results.push({
      account_id: a.id,
      account_name: a.name,
      account_code: a.account_code,
      income,
      expense,
      net: income - expense,
      balance: Number(a.opening_balance) + lifetimeIncome - lifetimeExpense,
    });
  }
  return results;
}
export async function detectRecurringExpenses() {
  const supabase = await createClient();
  const d = new Date(); d.setMonth(d.getMonth() - 6);
  const { data } = await supabase.from("transactions").select("description, amount, occurred_on").eq("txn_type", "expense").gte("occurred_on", d.toISOString().split("T")[0]).not("description", "is", null);
  const groups = new Map<string, { desc: string; baseAmount: number; entries: { amount: number; month: string }[] }>();
  for (const r of data ?? []) {
    const norm = normalizeDescription(r.description); if (!norm) continue;
    const amt = Number(r.amount), month = r.occurred_on.slice(0, 7);
    let matched = false;
    for (const [k, g] of groups) {
      if (k.startsWith(norm + "|") && Math.abs(g.baseAmount - amt) / g.baseAmount <= 0.05) { g.entries.push({ amount: amt, month }); matched = true; break; }
    }
    if (!matched) groups.set(`${norm}|${amt}`, { desc: r.description ?? norm, baseAmount: amt, entries: [{ amount: amt, month }] });
  }
  return Array.from(groups.values()).filter((g) => new Set(g.entries.map((e) => e.month)).size >= 3).map((g) => {
    const months = Array.from(new Set(g.entries.map((e) => e.month)));
    return { description: g.desc, amount: g.baseAmount, count: months.length, months, totalSpent: g.entries.reduce((s, e) => s + e.amount, 0) };
  }).sort((a, b) => b.totalSpent - a.totalSpent);
}
export async function detectSpendingSpikes() {
  const supabase = await createClient();
  const now = new Date();
  const curMonth = getMonthStart(now);
  const end = new Date(curMonth + "T00:00:00"); end.setMonth(end.getMonth() + 1);
  const [{ data: cur }, { data: hist }] = await Promise.all([
    supabase.from("transactions").select("category_id, amount, category:categories!category_id(name)").eq("txn_type", "expense").gte("occurred_on", curMonth).lt("occurred_on", end.toISOString().split("T")[0]),
    supabase.from("transactions").select("category_id, amount").eq("txn_type", "expense").gte("occurred_on", (() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return getMonthStart(d); })()).lt("occurred_on", curMonth),
  ]);
  const curByCat = new Map<string, { name: string; amount: number }>();
  for (const r of cur ?? []) { const cat = (Array.isArray(r.category) ? r.category[0] : r.category) as { name: string }|null; const e = curByCat.get(r.category_id); if (e) e.amount += Number(r.amount); else curByCat.set(r.category_id, { name: cat?.name ?? "Other", amount: Number(r.amount) }); }
  const histByCat = new Map<string, number>();
  for (const r of hist ?? []) { histByCat.set(r.category_id, (histByCat.get(r.category_id) ?? 0) + Number(r.amount)); }
  const spikes = [];
  for (const [id, c] of curByCat) {
    const avg = (histByCat.get(id) ?? 0) / 3;
    if (avg > 0) { const pct = ((c.amount - avg) / avg) * 100; if (pct >= 30) spikes.push({ category_name: c.name, current_month: curMonth, current_amount: c.amount, avg_amount: avg, increase_pct: pct }); }
  }
  return spikes.sort((a, b) => b.increase_pct - a.increase_pct);
}
export async function detectBudgetLeaks() {
  const supabase = await createClient();
  const months = [0, 1, 2].map((i) => { const d = new Date(); d.setMonth(d.getMonth() - i); return getMonthStart(d); });
  const { data: budgets } = await supabase.from("budgets").select("id, category_id, month_start, amount, category:categories!category_id(name)").in("month_start", months);
  if (!budgets?.length) return [];
  const byCat = new Map<string, { name: string; months: { budget: number; month: string }[] }>();
  for (const b of budgets) {
    const cat = (Array.isArray(b.category) ? b.category[0] : b.category) as { name: string }|null;
    const e = byCat.get(b.category_id);
    if (e) e.months.push({ budget: Number(b.amount), month: b.month_start });
    else byCat.set(b.category_id, { name: cat?.name ?? "Unknown", months: [{ budget: Number(b.amount), month: b.month_start }] });
  }
  const results = [];
  for (const [id, info] of byCat) {
    let over = 0, latest = 0;
    for (const m of info.months.sort((a, b) => b.month.localeCompare(a.month))) {
      const e = new Date(m.month + "T00:00:00"); e.setMonth(e.getMonth() + 1);
      const { data } = await supabase.from("transactions").select("amount").eq("category_id", id).eq("txn_type", "expense").gte("occurred_on", m.month).lt("occurred_on", e.toISOString().split("T")[0]);
      const spent = (data ?? []).reduce((s, t) => s + Number(t.amount), 0);
      if (spent - m.budget > 0) { over++; if (over === 1) latest = spent - m.budget; } else break;
    }
    if (over >= 2) results.push({ category_name: info.name, consecutive_over: over, latest_overspend: latest });
  }
  return results;
}
